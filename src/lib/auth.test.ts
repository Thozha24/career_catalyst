import { hashPassword, verifyPassword, generateOpaqueToken, hashToken } from "./auth";

describe("password hashing", () => {
  it("stores bcrypt hashes — never the plaintext", async () => {
    const hash = await hashPassword("correct horse battery 9");
    expect(hash).not.toContain("correct horse battery 9");
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("verifies the right password and rejects wrong ones", async () => {
    const hash = await hashPassword("hunter2hunter2");
    expect(await verifyPassword("hunter2hunter2", hash)).toBe(true);
    expect(await verifyPassword("hunter3hunter3", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("produces unique salts for identical passwords", async () => {
    const [a, b] = await Promise.all([hashPassword("same-password-1x"), hashPassword("same-password-1x")]);
    expect(a).not.toBe(b);
  });
});

describe("opaque tokens (reset / verification)", () => {
  it("returns a raw token and its sha256 hash", () => {
    const { raw, hash } = generateOpaqueToken();
    expect(raw).toHaveLength(64);
    expect(hash).toHaveLength(64);
    expect(hash).toBe(hashToken(raw));
  });

  it("raw tokens are random and hashes differ per token", () => {
    const t1 = generateOpaqueToken();
    const t2 = generateOpaqueToken();
    expect(t1.raw).not.toBe(t2.raw);
    expect(t1.hash).not.toBe(t2.hash);
    expect(hashToken("not-a-real-token")).not.toBe(t1.hash);
  });
});
