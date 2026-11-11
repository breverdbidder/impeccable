// Site registry storage. Supabase when configured, otherwise the bundled seed
// file (read-only). Kept behind one interface so the gate has one source.
import seed from "../../sites.config.json";
import type { Site } from "./ownership";

export type StoreEnv = { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE_KEY?: string };

export function connected(env: StoreEnv): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

async function sb(env: StoreEnv, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
}

export async function listSites(env: StoreEnv): Promise<Site[]> {
  if (!connected(env)) return seed.sites as Site[];
  const r = await sb(env, "sites?select=id,hostname,name,github_repo,verify_token,verified_at&order=name");
  if (!r.ok) throw new Error(`sites ${r.status}`);
  return (await r.json()) as Site[];
}

export async function markVerified(env: StoreEnv, id: string, method: string): Promise<void> {
  const r = await sb(env, `sites?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ verified_at: new Date().toISOString(), verify_method: method }),
  });
  if (!r.ok) throw new Error(`verify write ${r.status}`);
}

export async function audit(env: StoreEnv, row: { actor_type: string; actor_id: string; action: string; target?: string; output?: unknown }) {
  if (!connected(env)) return;
  await sb(env, "audit_log", { method: "POST", body: JSON.stringify(row), headers: { prefer: "return=minimal" } });
}
