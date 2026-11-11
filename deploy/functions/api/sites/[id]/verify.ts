import { verifyOwnership } from "../../../../src/lib/ownership";
import { audit, connected, listSites, markVerified, type StoreEnv } from "../../../../src/lib/store";
import type { Identity } from "../../../../src/lib/access";

type Ctx = { env: StoreEnv; params: { id: string }; data: { identity?: Identity } };

export const onRequestPost = async (ctx: Ctx): Promise<Response> => {
  if (!connected(ctx.env)) return Response.json({ error: "storage_not_connected" }, { status: 409 });
  const site = (await listSites(ctx.env)).find((s) => s.id === ctx.params.id);
  if (!site) return Response.json({ error: "not_found" }, { status: 404 });
  if (!site.hostname || !site.verify_token) return Response.json({ error: "site_incomplete" }, { status: 422 });
  const result = await verifyOwnership(site.hostname, site.verify_token);
  const actor = ctx.data.identity?.email ?? "unknown";
  if (result.ok) await markVerified(ctx.env, site.id, result.method!);
  await audit(ctx.env, { actor_type: "member", actor_id: actor, action: result.ok ? "site.verified" : "site.verify_failed", target: site.hostname, output: result.tried });
  return Response.json({ verified: result.ok, method: result.method, tried: result.tried }, { status: result.ok ? 200 : 422 });
};
