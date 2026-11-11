// Storage on Cloudflare D1 through the Worker's DB binding. When the binding is
// absent (static preview) the bundled seed list is served read-only.
import seed from "../../sites.config.json";
import type { Site } from "./ownership";

export type D1Stmt = { bind: (...v: unknown[]) => D1Stmt; all: <T>() => Promise<{ results: T[] }>; run: () => Promise<unknown>; first: <T>() => Promise<T | null> };
export type D1 = { prepare: (sql: string) => D1Stmt; batch: (stmts: D1Stmt[]) => Promise<unknown> };
export type StoreEnv = { DB?: D1 };

export const connected = (env: StoreEnv): env is { DB: D1 } => Boolean(env.DB);

export async function listSites(env: StoreEnv): Promise<Site[]> {
  if (!connected(env)) return seed.sites as Site[];
  const r = await env.DB.prepare("SELECT id, hostname, name, github_repo, verify_token, verified_at FROM sites ORDER BY name").all<Site>();
  return r.results;
}

export async function markVerified(env: StoreEnv, id: string, method: string): Promise<void> {
  if (!connected(env)) throw new Error("storage not connected");
  await env.DB.prepare("UPDATE sites SET verified_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'), verify_method = ? WHERE id = ?").bind(method, id).run();
}

export async function audit(env: StoreEnv, row: { actor_type: "member" | "agent" | "token" | "system"; actor_id: string; action: string; target?: string | null; detail?: unknown }) {
  if (!connected(env)) return;
  await env.DB.prepare("INSERT INTO audit_log (actor_type, actor_id, action, target, detail) VALUES (?, ?, ?, ?, ?)")
    .bind(row.actor_type, row.actor_id, row.action, row.target ?? null, row.detail === undefined ? null : JSON.stringify(row.detail))
    .run();
}

export type Finding = { id: number; site_id: string; source: string; severity: string; title: string; status: string; created_at: string };

export async function listFindings(env: StoreEnv): Promise<Finding[]> {
  if (!connected(env)) return [];
  const r = await env.DB.prepare(
    "SELECT id, site_id, source, severity, title, status, created_at FROM findings WHERE status IN ('open','in_progress') ORDER BY CASE severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, created_at DESC LIMIT 100",
  ).all<Finding>();
  return r.results;
}

/** Records one uptime result. The database refuses it if the site is unverified. */
export async function recordUptime(env: { DB: D1 }, siteId: string, target: string, ok: boolean, value: unknown, title: string) {
  await env.DB.prepare("INSERT OR IGNORE INTO monitors (site_id, kind, target) VALUES (?, 'uptime', ?)").bind(siteId, target).run();
  const mon = await env.DB.prepare("SELECT id FROM monitors WHERE site_id = ? AND kind = 'uptime' AND target = ?").bind(siteId, target).first<{ id: number }>();
  await env.DB.prepare("INSERT INTO checks (monitor_id, ok, value) VALUES (?, ?, ?)").bind(mon!.id, ok ? 1 : 0, JSON.stringify(value)).run();
  if (ok) {
    await env.DB.prepare("UPDATE findings SET status = 'fixed', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE site_id = ? AND dedupe_key = 'uptime:down' AND status = 'open'").bind(siteId).run();
  } else {
    await env.DB.prepare(
      "INSERT INTO findings (site_id, source, severity, title, evidence, dedupe_key) VALUES (?, 'uptime', 'high', ?, ?, 'uptime:down') ON CONFLICT (site_id, dedupe_key) DO UPDATE SET status = 'open', title = excluded.title, evidence = excluded.evidence, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')",
    ).bind(siteId, title, JSON.stringify(value)).run();
  }
}

export type CrawlSummary = { site_id: string; pages: number; crawled: number; broken: number; sitemap_count: number | null; sitemap_url: string | null; robots_status: number | null; sitemap_checked_at: string | null; last_tick: string | null };

export async function crawlSummary(env: StoreEnv): Promise<CrawlSummary[]> {
  if (!connected(env)) return [];
  const r = await env.DB.prepare(
    "SELECT s.id AS site_id, COUNT(p.url) AS pages, COUNT(p.last_crawled) AS crawled, COALESCE(SUM(p.status >= 400), 0) AS broken, c.sitemap_count, c.sitemap_url, c.robots_status, c.sitemap_checked_at, c.last_tick FROM sites s LEFT JOIN pages p ON p.site_id = s.id LEFT JOIN crawl_state c ON c.site_id = s.id GROUP BY s.id ORDER BY s.name",
  ).all<CrawlSummary>();
  return r.results;
}

export async function dismissFinding(env: StoreEnv, id: number): Promise<boolean> {
  if (!connected(env)) return false;
  const row = await env.DB.prepare("SELECT id FROM findings WHERE id = ? AND status IN ('open','in_progress')").bind(id).first<{ id: number }>();
  if (!row) return false;
  await env.DB.prepare("UPDATE findings SET status = 'dismissed', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?").bind(id).run();
  return true;
}

export type PageCheckRow = { site_id: string; url: string; reason: string; status: number | null; lcp_ms: number | null; cls: number | null; ttfb_ms: number | null; load_ms: number | null; transfer_bytes: number | null; requests: number | null; console_errors: number | null; shot_key: string | null; diff_pct: number | null; error: string | null; ran_at: string };

/** The most recent check for each site. */
export async function latestPageChecks(env: StoreEnv): Promise<PageCheckRow[]> {
  if (!connected(env)) return [];
  const r = await env.DB.prepare(
    "SELECT c.site_id, c.url, c.reason, c.status, c.lcp_ms, c.cls, c.ttfb_ms, c.load_ms, c.transfer_bytes, c.requests, c.console_errors, c.shot_key, c.diff_pct, c.error, c.ran_at FROM page_checks c JOIN (SELECT site_id, MAX(id) AS id FROM page_checks GROUP BY site_id) m ON m.id = c.id ORDER BY c.site_id",
  ).all<PageCheckRow>();
  return r.results;
}
