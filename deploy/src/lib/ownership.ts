// Ownership verification and the host gate. Every fetch of a monitored site
// goes through assertVerifiedHost. Nothing else in the codebase may call fetch
// on a site URL directly.

export type Site = {
  id: string;
  hostname: string | null;
  name: string;
  github_repo?: string | null;
  verify_token?: string | null;
  verify_method?: string | null;
  verified_at: string | null;
};

export class UnverifiedHostError extends Error {
  constructor(public host: string, reason: string) {
    super(`Refused: ${host} ${reason}. Deploy only touches sites that passed ownership verification.`);
    this.name = "UnverifiedHostError";
  }
}

export function normalizeHost(input: string): string {
  const raw = input.includes("://") ? new URL(input).hostname : input.split("/")[0]!.split(":")[0]!;
  return raw.trim().toLowerCase().replace(/\.$/, "");
}

/** Exact host match only. A verified apex does not cover subdomains, and the reverse. */
export function assertVerifiedHost(url: string, sites: Site[]): Site {
  let host: string;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") throw new UnverifiedHostError(u.hostname, "is not https");
    host = normalizeHost(u.hostname);
  } catch (e) {
    if (e instanceof UnverifiedHostError) throw e;
    throw new UnverifiedHostError(String(url), "is not a valid URL");
  }
  const site = sites.find((s) => s.hostname && normalizeHost(s.hostname) === host);
  if (!site) throw new UnverifiedHostError(host, "is not in the site registry");
  if (!site.verified_at) throw new UnverifiedHostError(host, "has not been verified");
  return site;
}

export const VERIFY_PREFIX = "deploy-verify=";
export const VERIFY_FILE = "/.well-known/deploy-verify.txt";

export function newVerifyToken(): string {
  const b = new Uint8Array(18);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export type VerifyMethod = "dns_txt" | "meta" | "file";
export type VerifyResult = { ok: boolean; method: VerifyMethod | null; tried: Record<VerifyMethod, string> };

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

async function checkDns(host: string, token: string, f: Fetcher): Promise<string> {
  const r = await f(`https://cloudflare-dns.com/dns-query?name=_deploy-verify.${host}&type=TXT`, {
    headers: { accept: "application/dns-json" },
  });
  if (!r.ok) return `resolver ${r.status}`;
  const j = (await r.json()) as { Answer?: { data: string }[] };
  const want = VERIFY_PREFIX + token;
  const hit = (j.Answer ?? []).some((a) => a.data.replace(/^"|"$/g, "").replace(/" "/g, "") === want);
  return hit ? "ok" : "record not found";
}

async function checkFile(host: string, token: string, f: Fetcher): Promise<string> {
  const r = await f(`https://${host}${VERIFY_FILE}`, { redirect: "error" });
  if (!r.ok) return `http ${r.status}`;
  return (await r.text()).trim() === VERIFY_PREFIX + token ? "ok" : "content mismatch";
}

async function checkMeta(host: string, token: string, f: Fetcher): Promise<string> {
  const r = await f(`https://${host}/`, { redirect: "error" });
  if (!r.ok) return `http ${r.status}`;
  const html = (await r.text()).slice(0, 200_000);
  const m = html.match(/<meta[^>]+name=["']deploy-verify["'][^>]*>/i);
  if (!m) return "tag not found";
  const c = m[0].match(/content=["']([^"']+)["']/i);
  return c && c[1] === token ? "ok" : "content mismatch";
}

/**
 * Proves control of a host. This is the only place allowed to fetch an
 * unverified host, and it fetches exactly three fixed locations.
 */
export async function verifyOwnership(hostname: string, token: string, f: Fetcher = fetch): Promise<VerifyResult> {
  const host = normalizeHost(hostname);
  const tried = { dns_txt: "skipped", meta: "skipped", file: "skipped" } as Record<VerifyMethod, string>;
  const checks: [VerifyMethod, (h: string, t: string, f: Fetcher) => Promise<string>][] = [
    ["dns_txt", checkDns],
    ["file", checkFile],
    ["meta", checkMeta],
  ];
  for (const [method, fn] of checks) {
    try {
      tried[method] = await fn(host, token, f);
    } catch (e) {
      tried[method] = `error: ${(e as Error).message}`;
    }
    if (tried[method] === "ok") return { ok: true, method, tried };
  }
  return { ok: false, method: null, tried };
}
