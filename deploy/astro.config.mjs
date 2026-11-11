import { defineConfig } from "astro/config";

// Static shell. The API lives in functions/ (Cloudflare Pages Functions).
export default defineConfig({ output: "static", build: { format: "directory" } });
