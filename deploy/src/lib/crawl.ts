// Crawl job. Each tick works on one verified site: refresh robots.txt and the
// sitemap once a day, then fetch the few pages that are most overdue, record
// what was found and raise or clear findings. Budgets keep one tick inside the
// Workers free-tier limits (50 subrequests, 50 D1 queries per invocation).
import { assertVerifiedHost, normalizeHost, type Site } from "./ownership";
import type { D1, D1Stmt } from "./store";

export type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export const LIMITS = { fetches: 18, pagesPerTick: 8, sitemapChildren: 3, sitemapUrls: 500, linksPerPage: 60, pagesPerSite: 2000, bodyBytes: 400_000 };
const UA = "deploy-internal-crawl/0.1";
const ASSET = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|map|json|xml|txt|pdf|zip|gz|woff2?|ttf|otf|mp4|webm|mov|mp3|wav)$/i;

// ---------- pure parsing ----------

export function parseRobots(text: string): { sitemaps: string[]; blocksAll: boolean } {
  const sitemaps: string[] = [];
  let inStar = false, blocksAll = false, allowsRoot = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1]!.toLowerCase(), val = m[2]!.trim();
    if (key === "sitemap") sitemaps.push(val);
    else if (key === "user-agent") inStar = val === "*";
    else if (inStar && key === "disallow" && val === "/") blocksAll = true;
    else if (inStar && key === "allow" && val === "/") allowsRoot = true;
  }
  return { sitemaps, blocksAll: blocksAll && !allowsRoot };
}

export function parseSitemap(xml: string): { kind: "index" | "urlset"; locs: string[] } {
  const locs = [...xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)\s*(?:\]\]>)?\s*<\/loc>/gi)].map((m) => m[1]!.replace(/&amp;/g, "&"));
  return { kind: /<sitemapindex[\s>]/i.test(xml) ? "index" : "urlset", locs };
}

const attr = (tag: string, name: string) => (tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i")) ?? []).slice(1).find((v) => v !== undefined);

export type PageFacts = { title: string | null; canonical: string | null; noindex: boolean; hasJsonLd: boolean; links: string[] };

export function parsePage(html: string, pageUrl: string): PageFacts {
  const head = html.slice(0, LIMITS.bodyBytes);
  const t = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = t ? t[1]!.replace(/\s+/g, " ").trim() || null : null;
  let canonical: string | null = null, noindex = false;
  for (const m of head.matchAll(/<(link|meta)\b[^>]*>/gi)) {
    const tag = m[0];
    if (m[1]!.toLowerCase() === "link" && /\bcanonical\b/i.test(attr(tag, "rel") ?? "")) canonical ??= attr(tag, "href") ?? null;
    if (m[1]!.toLowerCase() === "meta" && /^(robots|googlebot)$/i.test(attr(tag, "name") ?? "") && /noindex/i.test(attr(tag, "content") ?? "")) noindex = true;
  }
  const links = new Set<string>();
  // Anchors written inside scripts or templates are source text, not links on the page.
  const markup = head.replace(/<(script|template|style|noscript)\b[\s\S]*?<\/\1>/gi, " ");
  for (const m of markup.matchAll(/<a\b[^>]*>/gi)) {
    const href = attr(m[0], "href");
    if (!href || /^(#|mailto:|tel:|javascript:|data:)/i.test(href) || /\$\{|\{\{|%7B/i.test(href)) continue;
    try {
      const u = new URL(href.replace(/&amp;/g, "&"), pageUrl);
      u.hash = "";
      links.add(u.toString());
    } catch { /* unparseable href: ignore */ }
    if (links.size >= LIMITS.linksPerPage) break;
  }
  if (canonical) try { canonical = new URL(canonical, pageUrl).toString(); } catch { /* keep raw */ }
  return { title, canonical, noindex, hasJsonLd: /<script[^>]+type\s*=\s*["']application\/ld\+json["']/i.test(head), links: [...links] };
}

/** Same host, https, not an asset, query string dropped. Null means "do not crawl". */
export function crawlable(url: string, host: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || normalizeHost(u.hostname) !== host || ASSET.test(u.pathname)) return null;
    u.search = ""; u.hash = "";
    return u.toString();
  } catch { return null; }
}

async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Text that matters for "did the content change": tags, scripts and styles removed. */
export const visibleText = (html: string) => html.replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// ---------- the tick ----------

export type CrawlState = { site_id: string; robots_status: number | null; robots_blocks_all: number | null; sitemap_url: string | null; sitemap_count: number | null; sitemap_checked_at: string | null; last_tick: string | null };
type PageRow = { url: string; in_sitemap: number; found_on: string | null; content_hash: string | null };
type FindingIn = { key: string; severity: "high" | "medium" | "low"; title: string; evidence: unknown };
export type TickReport = { site: string | null; fetched: number; sitemapUrls: number | null; pages: { url: string; status: number }[]; raised: string[]; cleared: string[]; note?: string };

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";

export async function crawlTick(env: { DB: D1 }, sites: Site[], f: Fetcher = fetch, now = Date.now()): Promise<TickReport> {
  const verified = sites.filter((s) => s.hostname && s.verified_at);
  const rep: TickReport = { site: null, fetched: 0, sitemapUrls: null, pages: [], raised: [], cleared: [] };
  if (!verified.length) return { ...rep, note: "no verified sites" };

  const states = (await env.DB.prepare("SELECT * FROM crawl_state").all<CrawlState>()).results;
  const stateOf = (id: string) => states.find((s) => s.site_id === id);
  // Round robin: the verified site whose last tick is oldest (never-ticked first).
  const site = [...verified].sort((a, b) => (stateOf(a.id)?.last_tick ?? "").localeCompare(stateOf(b.id)?.last_tick ?? ""))[0]!;
  const host = normalizeHost(site.hostname!);
  const origin = `https://${host}`;
  const prev = stateOf(site.id);
  rep.site = site.id;

  let budget = LIMITS.fetches;
  const get = async (url: string): Promise<Response | null> => {
    assertVerifiedHost(url, sites); // throws for any host that is not ours and verified
    if (budget <= 0) return null;
    budget--; rep.fetched++;
    try {
      return await f(url, { redirect: "manual", signal: AbortSignal.timeout(12000), headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.5" } });
    } catch (e) {
      return new Response(String((e as Error).message), { status: 599 });
    }
  };

  const stmts: D1Stmt[] = [];
  const raise: FindingIn[] = [];
  const clear: string[] = [];
  const mark = (bad: boolean, fnd: FindingIn) => (bad ? raise.push(fnd) : clear.push(fnd.key));

  // 1. robots.txt and sitemap, once a day
  const stale = !prev?.sitemap_checked_at || now - Date.parse(prev.sitemap_checked_at) > 24 * 3600_000;
  if (stale) {
    const r = await get(`${origin}/robots.txt`);
    const robots = r && r.status === 200 ? parseRobots(await r.text()) : { sitemaps: [], blocksAll: false };
    mark(robots.blocksAll, { key: "robots:blocked", severity: "high", title: `${host}: robots.txt blocks every crawler`, evidence: { url: `${origin}/robots.txt` } });

    const candidates = [...robots.sitemaps.filter((u) => crawlableSitemap(u, host)), `${origin}/sitemap.xml`, `${origin}/sitemap-index.xml`];
    let sitemapUrl: string | null = null;
    const urls = new Set<string>();
    for (const c of [...new Set(candidates)]) {
      const s = await get(c);
      if (!s || s.status !== 200) continue;
      const sm = parseSitemap(await s.text());
      if (!sm.locs.length) continue;
      sitemapUrl = c;
      if (sm.kind === "urlset") sm.locs.forEach((u) => urls.add(u));
      else for (const child of sm.locs.filter((u) => crawlableSitemap(u, host)).slice(0, LIMITS.sitemapChildren)) {
        const cr = await get(child);
        if (cr && cr.status === 200) parseSitemap(await cr.text()).locs.forEach((u) => urls.add(u));
      }
      break;
    }
    const list = [...new Set([...urls].map((u) => crawlable(u, host)).filter((u): u is string => !!u))].slice(0, LIMITS.sitemapUrls);
    rep.sitemapUrls = list.length;
    const otherHosts = [...new Set([...urls].map(safeHost).filter((h): h is string => !!h && h !== host))].slice(0, 5);
    mark(Boolean(sitemapUrl) && urls.size > 0 && list.length === 0, { key: "sitemap:foreign", severity: "medium", title: `${host}: the sitemap lists ${urls.size} URLs and none are on this hostname${otherHosts.length ? ` (it lists ${otherHosts.join(", ")})` : ""}`, evidence: { sitemap: sitemapUrl, hosts: otherHosts } });

    // A path that cannot exist should not answer 200. If it does, broken links are invisible.
    const probe = await get(`${origin}/deploy-check-missing-page-${Math.floor(now / 86_400_000)}`);
    if (probe) mark(probe.status === 200, { key: "site:soft404", severity: "medium", title: `${host} answers 200 for pages that do not exist, so broken links cannot be detected`, evidence: { url: `${origin}/deploy-check-missing-page`, status: probe.status } });
    mark(!sitemapUrl, { key: "sitemap:missing", severity: "medium", title: `${host}: no sitemap found`, evidence: { tried: [...new Set(candidates)] } });
    const before = prev?.sitemap_count ?? 0;
    const lost = before - list.length;
    mark(Boolean(sitemapUrl) && before > 0 && lost >= 5 && lost / before >= 0.1, { key: "sitemap:shrunk", severity: "medium", title: `${host}: sitemap lost ${lost} URLs (${before} to ${list.length})`, evidence: { before, after: list.length, sitemap: sitemapUrl } });

    if (sitemapUrl) {
      stmts.push(env.DB.prepare("UPDATE pages SET in_sitemap = 0 WHERE site_id = ?").bind(site.id));
      // One statement however long the list: D1 allows 100 bound values per query.
      stmts.push(env.DB.prepare("INSERT INTO pages (site_id, url, in_sitemap) SELECT ?, value, 1 FROM json_each(?) WHERE true ON CONFLICT (site_id, url) DO UPDATE SET in_sitemap = 1").bind(site.id, JSON.stringify(list)));
    }
    stmts.push(env.DB.prepare(`INSERT INTO crawl_state (site_id, robots_status, robots_blocks_all, sitemap_url, sitemap_count, sitemap_checked_at, last_tick) VALUES (?, ?, ?, ?, ?, ${NOW}, ${NOW}) ON CONFLICT (site_id) DO UPDATE SET robots_status = excluded.robots_status, robots_blocks_all = excluded.robots_blocks_all, sitemap_url = excluded.sitemap_url, sitemap_count = excluded.sitemap_count, sitemap_checked_at = excluded.sitemap_checked_at, last_tick = excluded.last_tick`)
      .bind(site.id, r?.status ?? null, robots.blocksAll ? 1 : 0, sitemapUrl, sitemapUrl ? list.length : prev?.sitemap_count ?? null));
    // The home page is always a page, sitemap or not.
    stmts.push(env.DB.prepare("INSERT OR IGNORE INTO pages (site_id, url) VALUES (?, ?)").bind(site.id, `${origin}/`));
    await env.DB.batch(stmts.splice(0));
  } else {
    stmts.push(env.DB.prepare(`UPDATE crawl_state SET last_tick = ${NOW} WHERE site_id = ?`).bind(site.id));
  }

  // 2. the most overdue pages
  const due = (await env.DB.prepare("SELECT url, in_sitemap, found_on, content_hash FROM pages WHERE site_id = ? ORDER BY last_crawled IS NOT NULL, last_crawled LIMIT ?").bind(site.id, LIMITS.pagesPerTick).all<PageRow>()).results;
  const count = (await env.DB.prepare("SELECT COUNT(*) AS n FROM pages WHERE site_id = ?").bind(site.id).first<{ n: number }>())?.n ?? 0;
  const discovered = new Map<string, string>();

  for (const p of due) {
    const res = await get(p.url);
    if (!res) break; // out of budget; the rest stay due
    const status = res.status;
    const path = new URL(p.url).pathname;
    const from = p.found_on ? `, linked from ${new URL(p.found_on).pathname}` : "";
    let facts: PageFacts | null = null, hash: string | null = null, redirect: string | null = null;
    if (status >= 300 && status < 400) redirect = res.headers.get("location");
    if (status === 200 && /html/i.test(res.headers.get("content-type") ?? "")) {
      const html = (await res.text()).slice(0, LIMITS.bodyBytes);
      facts = parsePage(html, p.url);
      hash = await sha256(visibleText(html));
      for (const l of facts.links) { const c = crawlable(l, host); if (c && c !== p.url && !discovered.has(c)) discovered.set(c, p.url); }
    }
    rep.pages.push({ url: p.url, status });

    mark(status >= 400, { key: `page:status:${path}`, severity: p.in_sitemap ? "high" : "medium", title: `${host}${path} answers ${status === 599 ? "with a network error" : status}${p.in_sitemap ? " and is in the sitemap" : from}`, evidence: { url: p.url, status, found_on: p.found_on } });
    mark(Boolean(facts) && !facts!.title, { key: `page:title:${path}`, severity: "low", title: `${host}${path} has no title`, evidence: { url: p.url } });
    mark(Boolean(facts?.noindex) && p.in_sitemap === 1, { key: `page:noindex:${path}`, severity: "medium", title: `${host}${path} is in the sitemap but set to noindex`, evidence: { url: p.url } });
    const canonHost = facts?.canonical ? safeHost(facts.canonical) : null;
    mark(Boolean(canonHost) && canonHost !== host, { key: `page:canonical:${path}`, severity: "medium", title: `${host}${path} has a canonical on another host (${canonHost})`, evidence: { url: p.url, canonical: facts?.canonical } });

    const changed = hash !== null && p.content_hash !== null && hash !== p.content_hash;
    stmts.push(env.DB.prepare(`UPDATE pages SET status = ?, redirect_to = ?, title = ?, canonical = ?, noindex = ?, has_jsonld = ?, content_hash = COALESCE(?, content_hash), changed_at = CASE WHEN ? THEN ${NOW} ELSE changed_at END, last_crawled = ${NOW} WHERE site_id = ? AND url = ?`)
      .bind(status, redirect, facts?.title ?? null, facts?.canonical ?? null, facts ? (facts.noindex ? 1 : 0) : null, facts ? (facts.hasJsonLd ? 1 : 0) : null, hash, changed ? 1 : 0, site.id, p.url));
  }

  // 3. queue internal links we have not seen, up to the per-site cap
  const room = Math.max(0, LIMITS.pagesPerSite - count);
  const fresh = [...discovered].slice(0, Math.min(room, 120));
  if (fresh.length) stmts.push(env.DB.prepare("INSERT OR IGNORE INTO pages (site_id, url, found_on) SELECT ?, json_extract(value, '$[0]'), json_extract(value, '$[1]') FROM json_each(?)").bind(site.id, JSON.stringify(fresh)));

  // 4. findings: one row per problem, reopened if it returns, closed when it clears
  if (raise.length) stmts.push(env.DB.prepare(`INSERT INTO findings (site_id, source, severity, title, evidence, dedupe_key) SELECT ?, 'crawl', json_extract(value, '$.severity'), json_extract(value, '$.title'), json_extract(value, '$.evidence'), json_extract(value, '$.key') FROM json_each(?) WHERE true ON CONFLICT (site_id, dedupe_key) DO UPDATE SET status = CASE WHEN findings.status = 'dismissed' THEN 'dismissed' ELSE 'open' END, severity = excluded.severity, title = excluded.title, evidence = excluded.evidence, updated_at = ${NOW}`)
    .bind(site.id, JSON.stringify(raise.map((x) => ({ ...x, evidence: JSON.stringify(x.evidence) })))));
  if (clear.length) stmts.push(env.DB.prepare(`UPDATE findings SET status = 'fixed', updated_at = ${NOW} WHERE site_id = ? AND status IN ('open','in_progress') AND dedupe_key IN (SELECT value FROM json_each(?))`).bind(site.id, JSON.stringify(clear)));
  rep.raised = raise.map((x) => x.key);
  rep.cleared = clear;
  if (stmts.length) await env.DB.batch(stmts);
  return rep;
}

const safeHost = (u: string) => { try { return normalizeHost(new URL(u).hostname); } catch { return null; } };
const crawlableSitemap = (u: string, host: string) => { try { const x = new URL(u); return x.protocol === "https:" && normalizeHost(x.hostname) === host; } catch { return false; } };
