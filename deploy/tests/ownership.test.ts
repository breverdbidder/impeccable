import { describe, expect, it } from "vitest";
import { assertVerifiedHost, normalizeHost, UnverifiedHostError, verifyOwnership, type Site } from "../src/lib/ownership";

const sites: Site[] = [
  { id: "a", hostname: "biddeed.ai", name: "A", verified_at: "2026-11-11T00:00:00Z" },
  { id: "b", hostname: "dealdeed.app", name: "B", verified_at: null },
  { id: "c", hostname: null, name: "C", verified_at: null },
];

describe("assertVerifiedHost", () => {
  it("allows a verified host", () => expect(assertVerifiedHost("https://biddeed.ai/pricing", sites).id).toBe("a"));
  it("matches case-insensitively and ignores a trailing dot", () => expect(assertVerifiedHost("https://BidDeed.AI./", sites).id).toBe("a"));
  it("refuses a registered but unverified host", () => expect(() => assertVerifiedHost("https://dealdeed.app/", sites)).toThrow(/has not been verified/));
  it("refuses a host that is not ours", () => expect(() => assertVerifiedHost("https://ploy.ai/", sites)).toThrow(UnverifiedHostError));
  it("does not extend to subdomains", () => expect(() => assertVerifiedHost("https://evil.biddeed.ai/", sites)).toThrow(/not in the site registry/));
  it("is not fooled by a lookalike suffix or userinfo", () => {
    expect(() => assertVerifiedHost("https://biddeed.ai.evil.com/", sites)).toThrow(UnverifiedHostError);
    expect(() => assertVerifiedHost("https://biddeed.ai@evil.com/", sites)).toThrow(UnverifiedHostError);
  });
  it("refuses plain http and garbage", () => {
    expect(() => assertVerifiedHost("http://biddeed.ai/", sites)).toThrow(/not https/);
    expect(() => assertVerifiedHost("not a url", sites)).toThrow(/not a valid URL/);
  });
});

describe("normalizeHost", () => {
  it("strips scheme, path and port", () => expect(normalizeHost("https://Example.com:8443/x")).toBe("example.com"));
});

describe("verifyOwnership", () => {
  const token = "abc123";
  const mk = (map: Record<string, Response | Error>) => async (url: string) => {
    const hit = Object.entries(map).find(([k]) => url.includes(k));
    if (!hit) return new Response("", { status: 404 });
    if (hit[1] instanceof Error) throw hit[1];
    return hit[1].clone();
  };
  it("passes on a matching DNS TXT record", async () => {
    const f = mk({ "dns-query": Response.json({ Answer: [{ data: '"deploy-verify=abc123"' }] }) });
    const r = await verifyOwnership("biddeed.ai", token, f);
    expect(r).toMatchObject({ ok: true, method: "dns_txt" });
  });
  it("falls back to the file, then the meta tag", async () => {
    const f1 = mk({ "dns-query": Response.json({}), "deploy-verify.txt": new Response("deploy-verify=abc123\n") });
    expect((await verifyOwnership("biddeed.ai", token, f1)).method).toBe("file");
    const f2 = mk({ "dns-query": Response.json({}), "https://biddeed.ai/": new Response('<meta name="deploy-verify" content="abc123">') });
    expect((await verifyOwnership("biddeed.ai", token, f2)).method).toBe("meta");
  });
  it("fails on a wrong token and reports each attempt", async () => {
    const f = mk({ "dns-query": Response.json({ Answer: [{ data: '"deploy-verify=nope"' }] }), "deploy-verify.txt": new Error("boom") });
    const r = await verifyOwnership("biddeed.ai", token, f);
    expect(r.ok).toBe(false);
    expect(r.tried).toEqual({ dns_txt: "record not found", file: "error: boom", meta: "http 404" });
  });
});
