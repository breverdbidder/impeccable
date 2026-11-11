import { beforeEach, describe, expect, it } from "vitest";
import { resetAccessCache, verifyAccess } from "../src/lib/access";

const team = "everest.cloudflareaccess.com";
const aud = "aud-tag";
const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");

async function setup() {
  const kp = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
  const jwk = { ...(await crypto.subtle.exportKey("jwk", kp.publicKey)), kid: "k1" };
  const certs = (async () => Response.json({ keys: [jwk] })) as unknown as typeof fetch;
  const sign = async (claims: Record<string, unknown>) => {
    const body = `${enc({ alg: "RS256", kid: "k1" })}.${enc(claims)}`;
    const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", kp.privateKey, new TextEncoder().encode(body));
    return `${body}.${Buffer.from(sig).toString("base64url")}`;
  };
  return { certs, sign };
}
const req = (t?: string) => new Request("https://x/api/sites", { headers: t ? { "cf-access-jwt-assertion": t } : {} });
const good = { aud: [aud], iss: `https://${team}`, exp: Math.floor(Date.now() / 1000) + 600, email: "owner@example.com", sub: "u1" };
const env = { ACCESS_TEAM_DOMAIN: team, ACCESS_AUD: aud };

describe("verifyAccess", () => {
  beforeEach(resetAccessCache);
  it("accepts a valid token", async () => {
    const { certs, sign } = await setup();
    expect(await verifyAccess(req(await sign(good)), env, certs)).toEqual({ email: "owner@example.com", sub: "u1" });
  });
  it("fails closed when Access is not configured", async () => {
    await expect(verifyAccess(req("a.b.c"), {})).rejects.toThrow(/not configured/);
  });
  it("rejects a missing token, wrong audience, wrong issuer and expiry", async () => {
    const { certs, sign } = await setup();
    await expect(verifyAccess(req(), env, certs)).rejects.toThrow(/missing/);
    await expect(verifyAccess(req(await sign({ ...good, aud: ["other"] })), env, certs)).rejects.toThrow(/audience/);
    await expect(verifyAccess(req(await sign({ ...good, iss: "https://evil.example" })), env, certs)).rejects.toThrow(/issuer/);
    await expect(verifyAccess(req(await sign({ ...good, exp: 1 })), env, certs)).rejects.toThrow(/expired/);
  });
  it("rejects a tampered payload", async () => {
    const { certs, sign } = await setup();
    const [h, , s] = (await sign(good)).split(".");
    await expect(verifyAccess(req(`${h}.${enc({ ...good, email: "attacker@example.com" })}.${s}`), env, certs)).rejects.toThrow(/signature/);
  });
  it("applies the optional email allowlist", async () => {
    const { certs, sign } = await setup();
    await expect(verifyAccess(req(await sign(good)), { ...env, DEPLOY_ALLOWED_EMAILS: "someone@else.com" }, certs)).rejects.toThrow(/not allowed/);
  });
});
