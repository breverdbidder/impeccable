import { defineConfig } from "astro/config";

// Static shell. The API lives in functions/ (Cloudflare Pages Functions).
// Styles are inlined so each page is one self-contained file: the API upload path embeds pages as text.
export default defineConfig({ output: "static", build: { format: "directory", inlineStylesheets: "always" } });
