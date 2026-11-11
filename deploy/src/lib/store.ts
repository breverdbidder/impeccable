// Storage on Cloudflare D1 through the Worker's DB binding. When the binding is
// absent (static preview) the bundled seed list is served read-only.
import seed from "../../sites.config.json";
import type { Site } from "./ownership";

export type D1Stmt = { bind: (...v: unknown[]) => D1Stmt; all: <T>() => Promise<{ results: T[] }>; run: () => Promise<unknown>; first: <T>() => Promise<T | null> };
export type D1 = { prepare: (sql: string) => D1Stmt };
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
