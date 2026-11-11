import { listSites, connected, type StoreEnv } from "../../src/lib/store";

export const onRequestGet = async (ctx: { env: StoreEnv }): Promise<Response> => {
  const sites = await listSites(ctx.env);
  return Response.json({
    storage: connected(ctx.env) ? "supabase" : "seed",
    sites: sites.map(({ verify_token: _t, ...s }) => ({ ...s, verified: Boolean(s.verified_at) })),
  });
};
