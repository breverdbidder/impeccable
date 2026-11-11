import { describe, expect, it } from "vitest";
import { crawlable, crawlTick, parsePage, parseRobots, parseSitemap, LIMITS } from "../src/lib/crawl";
import { listSites } from "../src/lib/store";
import { testDb } from "./d1";

describe("parsers", () => {
  it("reads sitemaps and a blanket disallow from robots.txt", () => {
    expect(parseRobots("User-agent: *\nDisallow: /\nSitemap: https://a.com/s.xml")).toEqual({ sitemaps: ["https://a.com/s.xml"], blocksAll: true });
    expect(parseRobots("User-agent: *\nDisallow: /og/\nAllow: /").blocksAll).toBe(false);
    expect(parseRobots("User-agent: BadBot\nDisallow: /").blocksAll).toBe(false);
  });
  it("tells a sitemap index from a urlset", () => {
    expect(parseSitemap("<sitemapindex><sitemap><loc>https://a.com/s1.xml</loc></sitemap></sitemapindex>")).toEqual({ kind: "index", locs: ["https://a.com/s1.xml"] });
    expect(parseSitemap("<urlset><url><loc> https://a.com/x?a=1&amp;b=2 </loc></url></urlset>").locs).toEqual(["https://a.com/x?a=1&b=2"]);
  });
  it("extracts title, canonical, noindex, JSON-LD and links", () => {
    const f = parsePage(`<html><head><title> Hi  there </title><link rel="canonical" href="/p"><meta name="robots" content="noindex, follow">
      <script type="application/ld+json">{}</script></head><body><a href="/a#x">a</a><a href='https://other.com/z'>z</a><a href="mailto:x@y.z">m</a><a href=/bare>b</a></body></html>`, "https://a.com/p");
    expect(f).toEqual({ title: "Hi there", canonical: "https://a.com/p", noindex: true, hasJsonLd: true, links: ["https://a.com/a", "https://other.com/z", "https://a.com/bare"] });
  });
  it("ignores anchors inside scripts and unrendered template placeholders", () => {
    const f = parsePage('<body><a href="/real">r</a><script>const h = `<a href="${esc(a.url)}">x</a><a href="/in-script">y</a>`;</script><a href="/{{ slug }}">t</a><a href="/$%7Bx%7D">e</a></body>', "https://a.com/");
    expect(f.links).toEqual(["https://a.com/real"]);
  });
  it("only queues same-host https pages", () => {
    expect(crawlable("https://a.com/x?utm=1#h", "a.com")).toBe("https://a.com/x");
    expect(crawlable("https://sub.a.com/x", "a.com")).toBeNull();
    expect(crawlable("http://a.com/x", "a.com")).toBeNull();
    expect(crawlable("https://a.com/logo.png", "a.com")).toBeNull();
  });
});

const html = (title: string, body = "") => new Response(`<html><head><title>${title}</title></head><body>${body}</body></html>`, { headers: { "content-type": "text/html" } });

function site(routes: Record<string, () => Response>) {
  const calls: string[] = [];
  const f = async (url: string) => { calls.push(url); return (routes[new URL(url).pathname] ?? (() => new Response("nope", { status: 404 })))(); };
  return { f, calls };
}
function verified() {
  const t = testDb();
  t.raw.exec("UPDATE sites SET verified_at = '2026-11-11T00:00:00.000Z' WHERE id = 'biddeed'");
  return t;
}
const findings = (raw: ReturnType<typeof testDb>["raw"]) => raw.prepare("SELECT dedupe_key AS k, severity, status FROM findings ORDER BY dedupe_key").all();

describe("crawlTick", () => {
  it("does nothing, and fetches nothing, when no site is verified", async () => {
    const { db } = testDb();
    const { f, calls } = site({});
    const rep = await crawlTick({ DB: db }, await listSites({ DB: db }), f);
    expect(rep.note).toBe("no verified sites");
    expect(calls).toEqual([]);
  });

  it("reads the sitemap, crawls pages, queues internal links and reports problems", async () => {
    const { db, raw } = verified();
    const { f, calls } = site({
      "/robots.txt": () => new Response("User-agent: *\nAllow: /\nSitemap: https://biddeed.ai/sitemap.xml"),
      "/sitemap.xml": () => new Response("<urlset><url><loc>https://biddeed.ai/</loc></url><url><loc>https://biddeed.ai/pricing</loc></url><url><loc>https://biddeed.ai/gone</loc></url></urlset>"),
      "/": () => html("Home", '<a href="/pricing">p</a><a href="/blog/new-post">n</a><a href="https://ploy.ai/">x</a><a href="/logo.svg">l</a>'),
      "/pricing": () => html(""),
    });
    const rep = await crawlTick({ DB: db }, await listSites({ DB: db }), f);
    expect(rep).toMatchObject({ site: "biddeed", sitemapUrls: 3 });
    expect(calls.every((u) => u.startsWith("https://biddeed.ai/"))).toBe(true);
    expect(findings(raw)).toEqual([
      { k: "page:status:/gone", severity: "high", status: "open" },
      { k: "page:title:/pricing", severity: "low", status: "open" },
    ]);
    const pages = raw.prepare("SELECT url, in_sitemap, found_on, status FROM pages ORDER BY url").all();
    expect(pages).toContainEqual({ url: "https://biddeed.ai/blog/new-post", in_sitemap: 0, found_on: "https://biddeed.ai/", status: null });
    expect(pages.some((p) => String(p.url).includes("ploy.ai") || String(p.url).includes("logo.svg"))).toBe(false);
  });

  it("reports a broken internal link with its source, then clears it once fixed", async () => {
    const { db, raw } = verified();
    const routes: Record<string, () => Response> = {
      "/robots.txt": () => new Response(""),
      "/sitemap.xml": () => new Response("<urlset><url><loc>https://biddeed.ai/</loc></url></urlset>"),
      "/": () => html("Home", '<a href="/typo">t</a>'),
    };
    const { f } = site(routes);
    const env = { DB: db };
    await crawlTick(env, await listSites(env), f); // finds /typo
    await crawlTick(env, await listSites(env), f); // crawls /typo: 404
    const row = raw.prepare("SELECT title, severity, status FROM findings WHERE dedupe_key = 'page:status:/typo'").get();
    expect(row).toEqual({ title: "biddeed.ai/typo answers 404, linked from /", severity: "medium", status: "open" });
    routes["/typo"] = () => html("Fixed");
    raw.exec("UPDATE pages SET last_crawled = NULL WHERE url LIKE '%/typo'");
    await crawlTick(env, await listSites(env), f);
    expect(raw.prepare("SELECT status FROM findings WHERE dedupe_key = 'page:status:/typo'").get()).toEqual({ status: "fixed" });
    expect(raw.prepare("SELECT COUNT(*) AS n FROM findings WHERE dedupe_key = 'page:status:/typo'").get()).toEqual({ n: 1 });
  });

  it("flags a missing sitemap, a blanket robots block, noindex in the sitemap and a foreign canonical", async () => {
    const { db, raw } = verified();
    const { f } = site({
      "/robots.txt": () => new Response("User-agent: *\nDisallow: /"),
      "/": () => new Response('<html><head><title>T</title><link rel="canonical" href="https://other.example/"></head></html>', { headers: { "content-type": "text/html" } }),
    });
    await crawlTick({ DB: db }, await listSites({ DB: db }), f);
    expect(findings(raw).map((x) => x.k)).toEqual(["page:canonical:/", "robots:blocked", "sitemap:missing"]);
  });

  it("flags a sitemap that shrinks and keeps a dismissed finding dismissed", async () => {
    const { db, raw } = verified();
    const urls = (n: number) => `<urlset>${Array.from({ length: n }, (_, i) => `<url><loc>https://biddeed.ai/p${i}</loc></url>`).join("")}</urlset>`;
    let n = 40;
    const { f } = site({ "/robots.txt": () => new Response(""), "/sitemap.xml": () => new Response(urls(n)) });
    const env = { DB: db };
    await crawlTick(env, await listSites(env), f, Date.parse("2026-11-11T00:00:00Z"));
    n = 30;
    raw.exec("UPDATE crawl_state SET sitemap_checked_at = '2026-11-09T00:00:00.000Z'");
    await crawlTick(env, await listSites(env), f);
    expect(raw.prepare("SELECT title FROM findings WHERE dedupe_key = 'sitemap:shrunk'").get()).toEqual({ title: "biddeed.ai: sitemap lost 10 URLs (40 to 30)" });
    raw.exec("UPDATE findings SET status = 'dismissed' WHERE dedupe_key = 'sitemap:shrunk'");
    n = 20;
    raw.exec("UPDATE crawl_state SET sitemap_checked_at = '2026-11-09T00:00:00.000Z'");
    await crawlTick(env, await listSites(env), f);
    expect(raw.prepare("SELECT status FROM findings WHERE dedupe_key = 'sitemap:shrunk'").get()).toEqual({ status: "dismissed" });
  });

  it("flags a sitemap that lists only another hostname and a site that answers 200 for missing pages", async () => {
    const { db, raw } = verified();
    const { f } = site({
      "/robots.txt": () => new Response(""),
      "/sitemap.xml": () => new Response("<urlset><url><loc>https://www.biddeed.ai/</loc></url><url><loc>https://www.biddeed.ai/a</loc></url></urlset>"),
      "/": () => html("Home"),
    });
    const spa = async (url: string) => (new URL(url).pathname.startsWith("/deploy-check-missing-page") ? html("Home") : f(url));
    await crawlTick({ DB: db }, await listSites({ DB: db }), spa);
    const rows = raw.prepare("SELECT dedupe_key AS k, title FROM findings ORDER BY dedupe_key").all();
    expect(rows.map((r) => r.k)).toEqual(["site:soft404", "sitemap:foreign"]);
    expect(rows[1]!.title).toBe("biddeed.ai: the sitemap lists 2 URLs and none are on this hostname (it lists www.biddeed.ai)");
  });

  it("stays inside the fetch budget and never follows a redirect off-site", async () => {
    const { db, raw } = verified();
    const many = `<urlset>${Array.from({ length: 60 }, (_, i) => `<url><loc>https://biddeed.ai/p${i}</loc></url>`).join("")}</urlset>`;
    const routes: Record<string, () => Response> = { "/robots.txt": () => new Response(""), "/sitemap.xml": () => new Response(many) };
    for (let i = 0; i < 60; i++) routes[`/p${i}`] = () => new Response(null, { status: 301, headers: { location: "https://elsewhere.example/" } });
    const { f, calls } = site(routes);
    const rep = await crawlTick({ DB: db }, await listSites({ DB: db }), f);
    expect(rep.fetched).toBeLessThanOrEqual(LIMITS.fetches);
    expect(rep.pages.length).toBe(LIMITS.pagesPerTick);
    expect(calls.some((u) => u.includes("elsewhere"))).toBe(false);
    expect(raw.prepare("SELECT redirect_to FROM pages WHERE status = 301 LIMIT 1").get()).toEqual({ redirect_to: "https://elsewhere.example/" });
  });

  it("the database itself refuses pages for an unverified site", () => {
    const { raw } = testDb();
    expect(() => raw.exec("INSERT INTO pages (site_id, url) VALUES ('dealdeed', 'https://dealdeed.app/')")).toThrow(/not verified/);
  });
});
