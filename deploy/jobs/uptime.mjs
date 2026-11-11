#!/usr/bin/env node
// Uptime check (CP-14, first half). Reads the registry from Supabase, skips
// every site that is not verified, and records one check per verified site.
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node jobs/uptime.mjs
const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
if (!url || !key) {
  console.log("Supabase is not configured. Nothing checked.");
  process.exit(0);
}
const h = { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" };
const sb = (path, init = {}) => fetch(`${url}/rest/v1/${path}`, { ...init, headers: { ...h, ...(init.headers ?? {}) } });

const sites = await (await sb("sites?select=id,hostname,verified_at")).json();
for (const s of sites) {
  if (!s.verified_at || !s.hostname) {
    console.log(`skip ${s.id}: not verified`);
    continue;
  }
  const target = `https://${s.hostname}/`;
  let mon = (await (await sb(`monitors?site_id=eq.${s.id}&kind=eq.uptime&select=id`)).json())[0];
  if (!mon) {
    mon = (await (await sb("monitors", { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify({ site_id: s.id, kind: "uptime", target }) })).json())[0];
  }
  const t0 = Date.now();
  let status = 0, error = null;
  try {
    const r = await fetch(target, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(15000) });
    status = r.status;
  } catch (e) {
    error = String(e.message ?? e);
  }
  const ok = status >= 200 && status < 400;
  await sb("checks", { method: "POST", body: JSON.stringify({ monitor_id: mon.id, ok, value: { status, ms: Date.now() - t0, error } }) });
  if (!ok) {
    await sb("findings?on_conflict=site_id,dedupe_key", {
      method: "POST",
      headers: { prefer: "resolution=ignore-duplicates" },
      body: JSON.stringify({ site_id: s.id, source: "uptime", severity: "high", title: `${s.hostname} is not responding (${status || error})`, evidence: { status, error }, dedupe_key: "uptime:down" }),
    });
  }
  console.log(`${ok ? "up  " : "DOWN"} ${s.hostname} ${status} ${Date.now() - t0}ms`);
}
