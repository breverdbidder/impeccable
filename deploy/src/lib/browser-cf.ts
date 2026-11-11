// The Cloudflare Browser Rendering implementation of CheckBrowser. Not unit tested: it needs
// a real browser. The decisions around it are tested in tests/pagecheck.test.ts.
import puppeteer from "@cloudflare/puppeteer";
import type { Capture, CheckBrowser } from "./pagecheck";

const b64 = (u: Uint8Array) => { let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };

export async function openCloudflareBrowser(binding: unknown): Promise<CheckBrowser> {
  const browser = await puppeteer.launch(binding as never);
  return {
    async capture(url: string): Promise<Capture> {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari/537.36 deploy-internal-pagecheck/0.1");
      let consoleErrors = 0;
      const consoleMessages: string[] = [];
      const note = (text: string, where?: string) => { consoleErrors++; if (consoleMessages.length < 5) consoleMessages.push((text + (where ? ` (${where})` : "")).replace(/\s+/g, " ").slice(0, 240)); };
      page.on("console", (m) => { if (m.type() === "error") note(m.text(), m.location()?.url); });
      page.on("pageerror", (e) => note(String((e as Error)?.message ?? e)));
      await page.evaluateOnNewDocument(() => {
        const w = window as unknown as { __dp: { lcp: number | null; cls: number } };
        w.__dp = { lcp: null, cls: 0 };
        try {
          new PerformanceObserver((l) => { for (const e of l.getEntries()) w.__dp.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
          new PerformanceObserver((l) => { for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) w.__dp.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
        } catch { /* older engines: metrics stay null */ }
      });
      const res = await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 1500));
      const m = await page.evaluate(() => {
        const w = window as unknown as { __dp?: { lcp: number | null; cls: number } };
        const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
        const res = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
        return {
          lcp: w.__dp?.lcp ?? null, cls: w.__dp?.cls ?? null,
          ttfb: nav ? nav.responseStart : null, load: nav && nav.loadEventEnd ? nav.loadEventEnd : null,
          bytes: (nav?.transferSize ?? 0) + res.reduce((a, r) => a + (r.transferSize || 0), 0), requests: res.length + 1,
        };
      });
      const png = (await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1280, height: 1600 }, captureBeyondViewport: true })) as Uint8Array;
      const out: Capture = {
        status: res ? res.status() : null, finalUrl: page.url(),
        ttfb: m.ttfb === null ? null : Math.round(m.ttfb), lcp: m.lcp === null ? null : Math.round(m.lcp), cls: m.cls === null ? null : Math.round(m.cls * 1000) / 1000,
        load: m.load === null ? null : Math.round(m.load), bytes: m.bytes, requests: m.requests, consoleErrors, consoleMessages, png: new Uint8Array(png),
      };
      await page.close();
      return out;
    },
    async diff(before: Uint8Array, after: Uint8Array): Promise<number> {
      const page = await browser.newPage();
      await page.setContent("<!doctype html><title>diff</title>");
      // Decode and compare inside the browser: no image library in the Worker.
      const pct = await page.evaluate(async (a: string, b: string) => {
        const load = (src: string) => new Promise<HTMLImageElement>((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error("image")); i.src = "data:image/png;base64," + src; });
        const [ia, ib] = await Promise.all([load(a), load(b)]);
        const w = Math.min(ia.width, ib.width), h = Math.min(ia.height, ib.height);
        const px = (img: HTMLImageElement) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d")!; x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
        const da = px(ia), db = px(ib);
        let changed = 0;
        for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i]! - db[i]!) + Math.abs(da[i + 1]! - db[i + 1]!) + Math.abs(da[i + 2]! - db[i + 2]!) > 48) changed++;
        return (changed / (w * h)) * 100;
      }, b64(before), b64(after));
      await page.close();
      return pct;
    },
    close: () => browser.close(),
  };
}
