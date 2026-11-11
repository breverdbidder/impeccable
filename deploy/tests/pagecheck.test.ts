import { describe, expect, it } from "vitest";
import { pageCheckTick, pickDue, type Capture, type CheckBrowser, type ShotStore } from "../src/lib/pagecheck";
import { listSites } from "../src/lib/store";
import { testDb } from "./d1";

const png = (n: number) => new Uint8Array([137, 80, 78, 71, n]);
const good: Capture = { status: 200, finalUrl: "https://biddeed.ai/", ttfb: 80, lcp: 1200, cls: 0.01, load: 900, bytes: 500_000, requests: 30, consoleErrors: 0, png: png(1) };

function rig(caps: Partial<Capture>[] | (() => never), diffPct = 0) {
  const t = testDb();
  t.raw.exec("UPDATE sites SET verified_at = '2026-11-11T00:00:00.000Z' WHERE id = 'biddeed'");
  const store = new Map<string, Uint8Array>();
  const SHOTS: ShotStore = { put: async (k, b) => void store.set(k, b), get: async (k) => (store.has(k) ? { arrayBuffer: async () => store.get(k)!.buffer as ArrayBuffer } : null) };
  const visited: string[] = []; let closed = 0, diffs = 0, i = 0;
  const open = async (): Promise<CheckBrowser> => ({
    capture: async (url) => { visited.push(url); if (typeof caps === "function") caps(); return { ...good, ...(caps as Partial<Capture>[])[Math.min(i++, (caps as unknown[]).length - 1)] }; },
    diff: async () => { diffs++; return diffPct; },
    close: async () => void closed++,
  });
  const env = { DB: t.db, SHOTS };
  const run = async (now: number) => pageCheckTick(env, await listSites(env), open, now);
  const findings = () => t.raw.prepare("SELECT dedupe_key AS k, severity, status FROM findings ORDER BY dedupe_key").all();
  return { ...t, store, visited, run, findings, counts: () => ({ closed, diffs }) };
}
const T0 = Date.parse("2026-11-11T12:00:00Z");

describe("pickDue", () => {
  const row = (o: object) => ({ id: "a", hostname: "a.com", seen_hash: "h", shot_key: "k", last_check: "2026-11-11T11:00:00.000Z", content_hash: "h", ...o });
  it("checks a site that was never checked, changed, or is a day old, in that order", () => {
    expect(pickDue([row({})], T0)).toBeNull();
    expect(pickDue([row({ content_hash: "new" })], T0)?.reason).toBe("changed");
    expect(pickDue([row({ last_check: "2026-11-10T11:00:00.000Z" })], T0)?.reason).toBe("daily");
    expect(pickDue([row({ id: "old", last_check: "2026-11-10T11:00:00.000Z" }), row({ id: "chg", content_hash: "new" }), row({ id: "new", last_check: null })], T0)?.row.id).toBe("new");
  });
});

describe("pageCheckTick", () => {
  it("opens no browser when no site is verified", async () => {
    const t = testDb(); let opened = 0;
    const r = await pageCheckTick({ DB: t.db, SHOTS: { put: async () => {}, get: async () => null } }, await listSites({ DB: t.db }), async () => { opened++; throw new Error("no"); }, T0);
    expect(r.note).toBe("nothing due"); expect(opened).toBe(0);
  });

  it("records a first check, stores the screenshot and raises nothing for a healthy page", async () => {
    const r = rig([{}]);
    const rep = await r.run(T0);
    expect(rep).toMatchObject({ site: "biddeed", reason: "first", lcp: 1200, diff: null, raised: [] });
    expect(r.visited).toEqual(["https://biddeed.ai/"]);
    expect([...r.store.keys()]).toEqual(["biddeed/2026-11-11T12-00-00-000Z.png"]);
    expect(r.raw.prepare("SELECT reason, lcp_ms, shot_key, diff_pct FROM page_checks").get()).toEqual({ reason: "first", lcp_ms: 1200, shot_key: "biddeed/2026-11-11T12-00-00-000Z.png", diff_pct: null });
    expect(r.findings()).toEqual([]);
    expect(r.counts()).toEqual({ closed: 1, diffs: 0 });
  });

  it("does not check again until the content changes or a day passes", async () => {
    const r = rig([{}]);
    await r.run(T0);
    r.raw.exec("UPDATE page_check_state SET last_check = '2026-11-11T12:00:00.000Z'");
    expect((await r.run(T0 + 3600_000)).note).toBe("nothing due");
    expect((await r.run(T0 + 25 * 3600_000)).reason).toBe("daily");
  });

  it("re-checks after a deploy changes the page and reports a visual change, slow paint, layout shift and console errors", async () => {
    const r = rig([{}, { lcp: 4600, cls: 0.4, consoleErrors: 2, png: png(2) }], 12.345);
    await r.run(T0);
    r.raw.exec("UPDATE page_check_state SET last_check = '2026-11-11T12:00:00.000Z', content_hash = 'before'");
    r.raw.exec("INSERT INTO pages (site_id, url, content_hash) VALUES ('biddeed', 'https://biddeed.ai/', 'after')");
    const rep = await r.run(T0 + 600_000);
    expect(rep).toMatchObject({ reason: "changed", diff: 12.35 });
    expect(r.findings()).toEqual([
      { k: "page:console:/", severity: "low", status: "open" },
      { k: "perf:cls:/", severity: "medium", status: "open" },
      { k: "perf:lcp:/", severity: "high", status: "open" },
      { k: "visual:changed:/", severity: "medium", status: "open" },
    ]);
    expect(r.raw.prepare("SELECT title FROM findings WHERE dedupe_key = 'visual:changed:/'").get()).toEqual({ title: "biddeed.ai: the home page looks different, 12.35% of pixels changed since the last check" });
    expect(r.raw.prepare("SELECT content_hash FROM page_check_state").get()).toEqual({ content_hash: "after" });
  });

  it("clears findings when the next check is healthy", async () => {
    const r = rig([{ lcp: 3000 }, {}]);
    await r.run(T0);
    expect(r.findings()).toEqual([{ k: "perf:lcp:/", severity: "medium", status: "open" }]);
    r.raw.exec("UPDATE page_check_state SET last_check = '2026-11-10T00:00:00.000Z'");
    await r.run(T0 + 1000);
    expect(r.findings()).toEqual([{ k: "perf:lcp:/", severity: "medium", status: "fixed" }]);
  });

  it("keeps no screenshot and reports it when the page redirects to another host", async () => {
    const r = rig([{ finalUrl: "https://elsewhere.example/" }]);
    const rep = await r.run(T0);
    expect(rep.error).toBe("redirected to elsewhere.example");
    expect(r.store.size).toBe(0);
    expect(r.findings()).toEqual([{ k: "check:failed:/", severity: "medium", status: "open" }]);
  });

  it("closes the browser, keeps the old baseline and reports the failure when the browser throws", async () => {
    const r = rig(() => { throw new Error("Navigation timeout"); });
    r.raw.exec("INSERT INTO page_check_state (site_id, url, shot_key, last_check) VALUES ('biddeed', 'https://biddeed.ai/', 'biddeed/old.png', '2026-11-09T00:00:00.000Z')");
    const rep = await r.run(T0);
    expect(rep.error).toBe("Navigation timeout");
    expect(r.counts().closed).toBe(1);
    expect(r.raw.prepare("SELECT shot_key FROM page_check_state").get()).toEqual({ shot_key: "biddeed/old.png" });
    expect(r.raw.prepare("SELECT title FROM findings").get()).toEqual({ title: "biddeed.ai: the page check could not finish (Navigation timeout)" });
  });
});
