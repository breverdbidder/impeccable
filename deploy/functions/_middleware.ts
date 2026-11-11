import { verifyAccess, type AccessEnv } from "../src/lib/access";

type Ctx = { request: Request; env: AccessEnv; next: () => Promise<Response>; data: Record<string, unknown> };

// Fail closed: every /api request needs a valid Cloudflare Access identity.
export const onRequest = async (ctx: Ctx): Promise<Response> => {
  const url = new URL(ctx.request.url);
  if (!url.pathname.startsWith("/api/")) return ctx.next();
  try {
    ctx.data.identity = await verifyAccess(ctx.request, ctx.env);
  } catch (e) {
    return Response.json({ error: "unauthorized", reason: (e as Error).message }, { status: 401 });
  }
  return ctx.next();
};
