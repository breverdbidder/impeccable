// Cloudflare Access is the sign-in. The Pages project sits behind an Access
// application whose policy lists the allowed emails. Functions verify the JWT
// Access attaches to every request, so a request that bypasses Access is refused.

export type AccessEnv = {
  ACCESS_TEAM_DOMAIN?: string; // e.g. everest.cloudflareaccess.com
  ACCESS_AUD?: string; // Application Audience (AUD) tag
  DEPLOY_ALLOWED_EMAILS?: string; // optional second allowlist, comma separated
  DEPLOY_DEV?: string; // "1" only in local dev
};

export type Identity = { email: string; sub: string };

type Jwk = JsonWebKey & { kid: string };
let cache: { at: number; keys: Jwk[] } | null = null;

function b64url(s: string): Uint8Array<ArrayBuffer> {
  const p = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
  const bin = atob(p);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function keys(team: string, f: typeof fetch): Promise<Jwk[]> {
  if (cache && Date.now() - cache.at < 600_000) return cache.keys;
  const r = await f(`https://${team}/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error(`access certs ${r.status}`);
  const j = (await r.json()) as { keys: Jwk[] };
  cache = { at: Date.now(), keys: j.keys };
  return j.keys;
}

export function resetAccessCache() {
  cache = null;
}

export async function verifyAccess(req: Request, env: AccessEnv, f: typeof fetch = fetch): Promise<Identity> {
  if (env.DEPLOY_DEV === "1") return { email: "dev@localhost", sub: "dev" };
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) throw new Error("Access is not configured");
  const token = req.headers.get("cf-access-jwt-assertion");
  if (!token) throw new Error("missing Access token");
  const [h, p, s] = token.split(".");
  if (!h || !p || !s) throw new Error("malformed token");
  const header = JSON.parse(new TextDecoder().decode(b64url(h))) as { kid: string; alg: string };
  if (header.alg !== "RS256") throw new Error("unexpected alg");
  const jwk = (await keys(env.ACCESS_TEAM_DOMAIN, f)).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("unknown key");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(s), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) throw new Error("bad signature");
  const c = JSON.parse(new TextDecoder().decode(b64url(p))) as { aud: string[] | string; exp: number; iss: string; email?: string; sub: string };
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
  if (!aud.includes(env.ACCESS_AUD)) throw new Error("wrong audience");
  if (c.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) throw new Error("wrong issuer");
  if (c.exp * 1000 < Date.now()) throw new Error("expired");
  if (!c.email) throw new Error("no email claim");
  const allow = (env.DEPLOY_ALLOWED_EMAILS ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (allow.length && !allow.includes(c.email.toLowerCase())) throw new Error("email not allowed");
  return { email: c.email, sub: c.sub };
}
