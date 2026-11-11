// A D1 stand-in backed by node:sqlite, loaded with the real migrations, so
// tests run the same SQL (and the same guard triggers) as production.
import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { D1, D1Stmt } from "../src/lib/store";

export function testDb(): { db: D1; raw: DatabaseSync } {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = ON");
  const dir = join(import.meta.dirname, "..", "migrations");
  for (const f of readdirSync(dir).sort()) raw.exec(readFileSync(join(dir, f), "utf8"));
  const prepare = (sql: string): D1Stmt => {
    let args: unknown[] = [];
    const st: D1Stmt & { _run: () => void } = {
      bind: (...v) => ((args = v.map((x) => (x === undefined ? null : typeof x === "boolean" ? Number(x) : x))), st),
      all: async <T>() => ({ results: raw.prepare(sql).all(...(args as never[])) as T[] }),
      first: async <T>() => (raw.prepare(sql).get(...(args as never[])) ?? null) as T | null,
      run: async () => void raw.prepare(sql).run(...(args as never[])),
      _run: () => void raw.prepare(sql).run(...(args as never[])),
    };
    return st;
  };
  const db: D1 = {
    prepare,
    batch: async (stmts) => {
      raw.exec("BEGIN");
      try { for (const s of stmts) (s as unknown as { _run: () => void })._run(); raw.exec("COMMIT"); }
      catch (e) { raw.exec("ROLLBACK"); throw e; }
    },
  };
  return { db, raw };
}
