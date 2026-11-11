import { describe, expect, it } from "vitest";
import { handleApi, runUptime, type Env } from "../src/worker";
import type { D1, D1Stmt } from "../src/lib/store";
import { testDb } from "./d1";

// Minimal in-memory stand-in for the D1 calls the Worker makes.
function fakeDb(sites: Record<string, unknown>[]) {
  const log: { sql: string; args: unknown[] }[] = [];
  const db: D1 = {
    batch: async () => {},
    prepare(sql: string) {
      let args: unknown[] = [];
      const stmt: D1Stmt = {
        bind: (...v) => ((args = v), stmt),
        all: async <T>() => ({ results: (sql.includes("FROM sites") ? sites : []) as T[] }),
        first: async <T>() => ({ id: 1 }) as T,
        run: async () => {
          log.push({ sql, args });
          if (sql.startsWith("UPDATE sites SET verified_at")) sites.find((s) => s.id === args[1])!.verified_at = "now";
        },
      };
      return stmt;
    },
  };
  return { db, log };
}
const rows = () => [
  { id: "biddeed", hostname: "biddeed.ai", name: "BidDeed.AI", github_repo: null, verify_token: "tok1", verified_at: "2026-11-11T00:00:00Z" },
  { id: "dealdeed", hostname: "dealdeed.app", name: "DealDeed", github_repo: null, verify_token: "tok2", verified_at: null },
  { id: "zonewise", hostname: null, name: "ZoneWise", github_repo: null, verify_token: "tok3", verified_at: null },
];
const dev = { DEPLOY_DEV: "1" };

describe("API", () => {
  it("refuses every request without Access", async () => {
    const r = await handleApi(new Request("https://x/api/sites"), { DB: fakeDb(rows()).db });
    expect(r.status).toBe(401);
  });
  it("lists sites without leaking proof tokens", async () => {
    const r = await handleApi(new Request("https://x/api/sites"), { ...dev, DB: fakeDb(rows()).db });
    const j = (await r.json()) as { storage: string; sites: Record<string, unknown>[] };
    expect(j.storage).toBe("d1");
    expect(j.sites.map((s) => s.verified)).toEqual([true, false, false]);
    expect(JSON.stringify(j)).not.toContain("tok");
  });
  it("verifies a site from a DNS proof and writes an audit row", async () => {
    const { db, log } = fakeDb(rows());
    const f = async (u: string) => (u.includes("dns-query") ? Response.json({ Answer: [{ data: '"deploy-verify=tok2"' }] }) : new Response("", { status: 404 }));
    const r = await handleApi(new Request("https://x/api/sites/dealdeed/verify", { method: "POST" }), { ...dev, DB: db }, f);
    expect(await r.json()).toMatchObject({ verified: true, method: "dns_txt" });
    expect(log.some((l) => l.sql.startsWith("UPDATE sites SET verified_at"))).toBe(true);
    expect(log.some((l) => l.sql.includes("audit_log") && l.args.includes("site.verified"))).toBe(true);
  });
  it("leaves a site unverified when no proof matches", async () => {
    const { db, log } = fakeDb(rows());
    const r = await handleApi(new Request("https://x/api/sites/dealdeed/verify", { method: "POST" }), { ...dev, DB: db }, async () => new Response("", { status: 404 }));
    expect(r.status).toBe(422);
    expect(log.some((l) => l.sql.startsWith("UPDATE sites"))).toBe(false);
  });
});

describe("uptime job", () => {
  it("fetches only verified hosts", async () => {
    const fetched: string[] = [];
    const f = async (u: string) => (fetched.push(u), new Response("ok"));
    const out = await runUptime({ DB: fakeDb(rows()).db } as Env, f);
    expect(fetched).toEqual(["https://biddeed.ai/"]);
    expect(out).toEqual([
      { site: "biddeed", result: "up 200" },
      { site: "dealdeed", result: "skipped: not verified" },
      { site: "zonewise", result: "skipped: no hostname" },
    ]);
  });
  it("raises one deduplicated finding when a site is down", async () => {
    const { db, log } = fakeDb(rows());
    await runUptime({ DB: db } as Env, async () => new Response("", { status: 503 }));
    const ins = log.filter((l) => l.sql.startsWith("INSERT INTO findings"));
    expect(ins).toHaveLength(1);
    expect(ins[0]!.sql).toContain("ON CONFLICT (site_id, dedupe_key)");
  });
});

describe("status and undo, against the real schema", () => {
  const env = () => { const t = testDb(); t.raw.exec("UPDATE sites SET verified_at = '2026-11-11T00:00:00.000Z' WHERE id IN ('biddeed','dealdeed')"); return { t, e: { ...dev, DB: t.db } as Env }; };
  const call = async (e: Env, path: string, method = "GET") => handleApi(new Request("https://x" + path, { method }), e);

  it("reports the latest uptime result per site, when an outage began, and spend against the cap", async () => {
    const { t, e } = env();
    await runUptime(e, async (u: string) => new Response("", { status: u.includes("biddeed") ? 503 : 200 }));
    await runUptime(e, async (u: string) => new Response("", { status: u.includes("biddeed") ? 503 : 200 }));
    t.raw.exec("INSERT INTO usage (provider, model, cost_cents) VALUES ('x', 'y', 125)");
    const j = (await (await call(e, "/api/status")).json()) as { sites: { site_id: string; ok: number; status: number; down_since: string | null }[]; spend_cents: number; cap_cents: number };
    expect(j.sites.map((s) => [s.site_id, s.ok, s.status, s.down_since !== null])).toEqual([["biddeed", 0, 503, true], ["dealdeed", 1, 200, false]]);
    expect([j.spend_cents, j.cap_cents]).toEqual([125, 10000]);
  });

  it("lets a dismissal be undone, once, and records both in the audit log", async () => {
    const { t, e } = env();
    t.raw.exec("INSERT INTO findings (site_id, source, severity, title, evidence, dedupe_key) VALUES ('biddeed','crawl','low','t','{}','k')");
    expect((await call(e, "/api/findings/1/reopen", "POST")).status).toBe(404);
    expect((await call(e, "/api/findings/1/dismiss", "POST")).status).toBe(200);
    expect((await call(e, "/api/findings/1/reopen", "POST")).status).toBe(200);
    expect((await call(e, "/api/findings/1/reopen", "POST")).status).toBe(404);
    expect(t.raw.prepare("SELECT status FROM findings WHERE id = 1").get()).toEqual({ status: "open" });
    expect(t.raw.prepare("SELECT action FROM audit_log ORDER BY id").all().map((r) => r.action)).toEqual(["finding.dismissed", "finding.reopened"]);
  });

  it("includes how each site was verified, never the proof token", async () => {
    const { t, e } = env();
    t.raw.exec("UPDATE sites SET verify_method = 'dns_txt' WHERE id = 'biddeed'");
    const body = await (await call(e, "/api/sites")).text();
    expect(body).toContain('"verify_method":"dns_txt"');
    expect(body).not.toContain("verify_token");
  });
});
