// Deploy Worker. Serves the static shell from ASSETS, the API under /api, and
// runs monitors on a cron trigger. Everything runs on our Cloudflare account.
import { verifyAccess, type AccessEnv, type Identity } from "./lib/access";
import { assertVerifiedHost, verifyOwnership } from "./lib/ownership";
import { audit, connected, listFindings, listSites, markVerified, recordUptime, type StoreEnv } from "./lib/store";

export type Env = AccessEnv & StoreEnv & { ASSETS?: { fetch: (r: Request) => Promise<Response> } };
type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

export async function handleApi(req: Request, env: Env, f: Fetcher = fetch): Promise<Response> {
  let who: Identity;
  try {
    who = await verifyAccess(req, env);
  } catch (e) {
    return json({ error: "unauthorized", reason: (e as Error).message }, 401);
  }
  const { pathname } = new URL(req.url);

  if (req.method === "GET" && pathname === "/api/sites") {
    const sites = await listSites(env);
    return json({ storage: connected(env) ? "d1" : "seed", sites: sites.map(({ verify_token: _t, ...s }) => ({ ...s, verified: Boolean(s.verified_at) })) });
  }

  if (req.method === "GET" && pathname === "/api/findings") return json({ findings: await listFindings(env) });

  // The proof token is shown only to a signed-in member, one site at a time.
  const tok = pathname.match(/^\/api\/sites\/([a-z0-9-]+)\/token$/);
  if (req.method === "GET" && tok) {
    const site = (await listSites(env)).find((s) => s.id === tok[1]);
    if (!site) return json({ error: "not_found" }, 404);
    if (!site.verify_token) return json({ error: "storage_not_connected" }, 409);
    await audit(env, { actor_type: "member", actor_id: who.email, action: "site.token_viewed", target: site.id });
    return json({ id: site.id, hostname: site.hostname, token: site.verify_token });
  }

  const ver = pathname.match(/^\/api\/sites\/([a-z0-9-]+)\/verify$/);
  if (req.method === "POST" && ver) {
    if (!connected(env)) return json({ error: "storage_not_connected" }, 409);
    const site = (await listSites(env)).find((s) => s.id === ver[1]);
    if (!site) return json({ error: "not_found" }, 404);
    if (!site.hostname || !site.verify_token) return json({ error: "site_incomplete" }, 422);
    const result = await verifyOwnership(site.hostname, site.verify_token, f);
    if (result.ok) await markVerified(env, site.id, result.method!);
    await audit(env, { actor_type: "member", actor_id: who.email, action: result.ok ? "site.verified" : "site.verify_failed", target: site.hostname, detail: result.tried });
    return json({ verified: result.ok, method: result.method, tried: result.tried }, result.ok ? 200 : 422);
  }

  return json({ error: "not_found" }, 404);
}

/** Uptime pass over verified sites only. Returns what it did, for logs and tests. */
export async function runUptime(env: Env, f: Fetcher = fetch): Promise<{ site: string; result: string }[]> {
  if (!connected(env)) return [];
  const sites = await listSites(env);
  const out: { site: string; result: string }[] = [];
  for (const s of sites) {
    if (!s.hostname) { out.push({ site: s.id, result: "skipped: no hostname" }); continue; }
    const target = `https://${s.hostname}/`;
    try {
      assertVerifiedHost(target, sites);
    } catch {
      out.push({ site: s.id, result: "skipped: not verified" });
      continue;
    }
    const t0 = Date.now();
    let status = 0, error: string | null = null;
    try {
      const r = await f(target, { redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "user-agent": "deploy-internal-uptime/0.1" } });
      status = r.status;
    } catch (e) {
      error = (e as Error).message;
    }
    const ok = status >= 200 && status < 400;
    await recordUptime(env, s.id, target, ok, { status, ms: Date.now() - t0, error }, `${s.hostname} is not responding (${status || error})`);
    out.push({ site: s.id, result: ok ? `up ${status}` : `down ${status || error}` });
  }
  return out;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (new URL(req.url).pathname.startsWith("/api/")) return handleApi(req, env);
    return env.ASSETS ? env.ASSETS.fetch(req) : new Response("Not found", { status: 404 });
  },
  async scheduled(_event: unknown, env: Env, ctx: { waitUntil: (p: Promise<unknown>) => void }) {
    ctx.waitUntil(runUptime(env).then((r) => console.log(JSON.stringify({ job: "uptime", r }))));
  },
};
