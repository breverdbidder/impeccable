// Single-file build of the Worker for uploads through the Cloudflare API,
// where static assets cannot be sent separately. Pages are embedded as text.
import worker, { handleApi, type Env } from "./worker";
// @ts-expect-error bundled as text by esbuild
import home from "../dist/index.html";
// @ts-expect-error bundled as text by esbuild
import settings from "../dist/settings/index.html";

const page = (body: string) =>
  new Response(body, { headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex, nofollow", "x-frame-options": "DENY", "x-content-type-options": "nosniff", "referrer-policy": "same-origin", "cache-control": "no-store" } });

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const p = new URL(req.url).pathname;
    if (p.startsWith("/api/")) return handleApi(req, env);
    if (p === "/") return page(home as string);
    if (p === "/settings" || p === "/settings/") return page(settings as string);
    if (p === "/robots.txt") return new Response("User-agent: *\nDisallow: /\n", { headers: { "content-type": "text/plain" } });
    return new Response("Not found", { status: 404 });
  },
  scheduled: worker.scheduled,
};
