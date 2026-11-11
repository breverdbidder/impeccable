import { describe, expect, it } from "vitest";
import { handleApi, runUptime, type Env } from "../src/worker";
import type { D1, D1Stmt } from "../src/lib/store";

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
