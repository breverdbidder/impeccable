// Page check. A real browser loads one verified site's home page per run when it is due:
// never checked, its content changed since the last check (the crawl's content hash, which
// is how a new deploy shows up), or a day has passed. It records lab metrics and a
// screenshot, compares the screenshot with the previous one, and raises or clears findings.
// These are lab numbers from one load in a data centre, not Lighthouse scores or field data.
import { assertVerifiedHost, normalizeHost, type Site } from "./ownership";
import type { D1 } from "./store";

export type Capture = {
  status: number | null; finalUrl: string;
  ttfb: number | null; lcp: number | null; cls: number | null; load: number | null;
  bytes: number | null; requests: number | null; consoleErrors: number;
  /** The first few error messages, so a finding can say what is wrong and not only how many. */
  consoleMessages?: string[];
  png: Uint8Array | null;
};
export interface CheckBrowser {
  capture(url: string): Promise<Capture>;
  /** Share of pixels that differ between two PNGs, 0 to 100. */
  diff(before: Uint8Array, after: Uint8Array): Promise<number>;
  close(): Promise<void>;
}
export interface ShotStore {
  put(key: string, body: Uint8Array, opts?: { httpMetadata?: { contentType: string } }): Promise<unknown>;
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
}

export const THRESHOLDS = { lcpPoor: 4000, lcpNeedsWork: 2500, clsPoor: 0.25, diffPct: 5, dayMs: 24 * 3600_000 };
export type CheckReport = { site: string | null; reason?: string; note?: string; lcp?: number | null; diff?: number | null; raised: string[]; cleared: string[]; error?: string };

type DueRow = { id: string; hostname: string; seen_hash: string | null; shot_key: string | null; last_check: string | null; content_hash: string | null };
const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";

export function pickDue(rows: DueRow[], now: number): { row: DueRow; reason: "first" | "changed" | "daily" } | null {
  const rank = (r: DueRow) =>
    !r.last_check ? "first" : r.content_hash && r.seen_hash && r.content_hash !== r.seen_hash ? "changed" : now - Date.parse(r.last_check) > THRESHOLDS.dayMs ? "daily" : null;
  const order = { first: 0, changed: 1, daily: 2 } as const;
  const due = rows.map((row) => ({ row, reason: rank(row) })).filter((x): x is { row: DueRow; reason: "first" | "changed" | "daily" } => x.reason !== null);
  due.sort((a, b) => order[a.reason] - order[b.reason] || (a.row.last_check ?? "").localeCompare(b.row.last_check ?? ""));
  return due[0] ?? null;
}

export async function pageCheckTick(env: { DB: D1; SHOTS: ShotStore }, sites: Site[], open: () => Promise<CheckBrowser>, now = Date.now()): Promise<CheckReport> {
  const rep: CheckReport = { site: null, raised: [], cleared: [] };
  const rows = (await env.DB.prepare(
    "SELECT s.id, s.hostname, st.content_hash AS seen_hash, st.shot_key, st.last_check, p.content_hash FROM sites s LEFT JOIN page_check_state st ON st.site_id = s.id AND st.url = 'https://' || s.hostname || '/' LEFT JOIN pages p ON p.site_id = s.id AND p.url = 'https://' || s.hostname || '/' WHERE s.verified_at IS NOT NULL AND s.hostname IS NOT NULL",
  ).all<DueRow>()).results;
  const due = pickDue(rows, now);
  if (!due) return { ...rep, note: "nothing due" };
  const { row, reason } = due;
  const host = normalizeHost(row.hostname);
  const url = `https://${host}/`;
  assertVerifiedHost(url, sites);
  rep.site = row.id; rep.reason = reason;

  let cap: Capture | null = null, diff: number | null = null, error: string | null = null, key: string | null = null;
  const browser = await open();
  try {
    cap = await browser.capture(url);
    const finalHost = (() => { try { return normalizeHost(new URL(cap!.finalUrl).hostname); } catch { return null; } })();
    if (finalHost !== host) { error = `redirected to ${finalHost ?? "an unreadable address"}`; cap.png = null; }
    if (cap.png) {
      key = `${row.id}/${new Date(now).toISOString().replace(/[:.]/g, "-")}.png`;
      await env.SHOTS.put(key, cap.png, { httpMetadata: { contentType: "image/png" } });
      if (row.shot_key) {
        const prev = await env.SHOTS.get(row.shot_key);
        if (prev) diff = Math.round((await browser.diff(new Uint8Array(await prev.arrayBuffer()), cap.png)) * 100) / 100;
      }
    }
  } catch (e) {
    error = (e as Error).message.slice(0, 300);
  } finally {
    await browser.close().catch(() => {});
  }
  rep.lcp = cap?.lcp ?? null; rep.diff = diff; if (error) rep.error = error;

  const raise: { key: string; severity: string; title: string; evidence: string }[] = [];
  const clear: string[] = [];
  const mark = (bad: boolean, key: string, severity: "high" | "medium" | "low", title: string, evidence: unknown) =>
    bad ? raise.push({ key, severity, title, evidence: JSON.stringify(evidence) }) : clear.push(key);
  const ev = { url, shot: key, previous: row.shot_key };
  mark(Boolean(error), "check:failed:/", "medium", `${host}: the page check could not finish (${error})`, ev);
  if (cap && !error) {
    const lcp = cap.lcp;
    mark(lcp !== null && lcp > THRESHOLDS.lcpNeedsWork, "perf:lcp:/", lcp !== null && lcp > THRESHOLDS.lcpPoor ? "high" : "medium", `${host}: largest content took ${((lcp ?? 0) / 1000).toFixed(1)} s to appear (good is under 2.5 s)`, { ...ev, lcp_ms: lcp });
    mark(cap.cls !== null && cap.cls > THRESHOLDS.clsPoor, "perf:cls:/", "medium", `${host}: the layout shifts while loading (score ${cap.cls?.toFixed(2)}, good is under 0.1)`, { ...ev, cls: cap.cls });
    const first = cap.consoleMessages?.[0];
    mark(cap.consoleErrors > 0, "page:console:/", "low", `${host}: the home page logs ${cap.consoleErrors} console error${cap.consoleErrors === 1 ? "" : "s"}${first ? `. First: ${first}` : ""}`, { ...ev, messages: cap.consoleMessages ?? [] });
    mark(diff !== null && diff >= THRESHOLDS.diffPct, "visual:changed:/", "medium", `${host}: the home page looks different, ${diff}% of pixels changed since the last check`, { ...ev, diff_pct: diff });
  }

  const stmts = [
    env.DB.prepare("INSERT INTO page_checks (site_id, url, reason, status, final_url, ttfb_ms, lcp_ms, cls, load_ms, transfer_bytes, requests, console_errors, shot_key, diff_pct, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(row.id, url, reason, cap?.status ?? null, cap?.finalUrl ?? null, cap?.ttfb ?? null, cap?.lcp ?? null, cap?.cls ?? null, cap?.load ?? null, cap?.bytes ?? null, cap?.requests ?? null, cap?.consoleErrors ?? null, key, diff, error),
    // A failed run keeps the old baseline; a good one moves it forward.
    env.DB.prepare(`INSERT INTO page_check_state (site_id, url, content_hash, shot_key, last_check) VALUES (?, ?, ?, ?, ${NOW}) ON CONFLICT (site_id, url) DO UPDATE SET content_hash = COALESCE(excluded.content_hash, page_check_state.content_hash), shot_key = COALESCE(excluded.shot_key, page_check_state.shot_key), last_check = excluded.last_check`)
      .bind(row.id, url, row.content_hash, key),
  ];
  if (raise.length) stmts.push(env.DB.prepare(`INSERT INTO findings (site_id, source, severity, title, evidence, dedupe_key) SELECT ?, 'pagecheck', json_extract(value, '$.severity'), json_extract(value, '$.title'), json_extract(value, '$.evidence'), json_extract(value, '$.key') FROM json_each(?) WHERE true ON CONFLICT (site_id, dedupe_key) DO UPDATE SET status = CASE WHEN findings.status = 'dismissed' THEN 'dismissed' ELSE 'open' END, severity = excluded.severity, title = excluded.title, evidence = excluded.evidence, updated_at = ${NOW}`).bind(row.id, JSON.stringify(raise)));
  if (clear.length) stmts.push(env.DB.prepare(`UPDATE findings SET status = 'fixed', updated_at = ${NOW} WHERE site_id = ? AND status IN ('open','in_progress') AND dedupe_key IN (SELECT value FROM json_each(?))`).bind(row.id, JSON.stringify(clear)));
  await env.DB.batch(stmts);
  rep.raised = raise.map((x) => x.key); rep.cleared = clear;
  return rep;
}
