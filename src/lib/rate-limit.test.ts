import {
  rateLimit,
  limitOrThrow,
  checkLoginLock,
  recordLoginFailure,
  recordLoginSuccess,
} from "./rate-limit";

describe("fixed-window rate limiting", () => {
  it("allows requests within the limit then blocks", () => {
    const key = `test-window:${Date.now()}:${Math.random()}`;
    const results = Array.from({ length: 4 }, (_, i) => rateLimit(key, 3, 60_000));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results[3]?.retryAfterSec).toBeGreaterThan(0);
  });

  it("isolates different identifiers", () => {
    const a = `iso:${Math.random()}`;
    rateLimit(a, 1, 60_000);
    expect(rateLimit(a, 1, 60_000).allowed).toBe(false);
    expect(rateLimit(`${a}-b`, 1, 60_000).allowed).toBe(true);
  });

  it("limitOrThrow throws a 429-flavored error when exhausted", () => {
    const key = `throw:${Math.random()}`;
    expect(() => {
      for (let i = 0; i < 5; i++) limitOrThrow(key, 3, 60_000);
    }).toThrow(/too many requests/i);
  });
});

describe("login brute-force lockout", () => {
  const key = (tag: string) => `login-test:${tag}:${Math.random()}`;

  it("does not lock below the failure threshold", () => {
    const k = key("under");
    recordLoginFailure(k);
    recordLoginFailure(k);
    recordLoginFailure(k);
    recordLoginFailure(k);
    expect(checkLoginLock(k).locked).toBe(false);
  });

  it("locks after 5 failures and the lock blocks the check", () => {
    const k = key("lock5");
    for (let i = 0; i < 5; i++) recordLoginFailure(k);
    expect(checkLoginLock(k).locked).toBe(true);
    expect(checkLoginLock(k).retryAfterSec).toBeGreaterThan(0);
  });

  it("escalates lockout duration with repeated failures without touching other accounts", () => {
    const k = key("escalate");
    for (let i = 0; i < 6; i++) recordLoginFailure(k);
    for (let i = 0; i < 3; i++) recordLoginFailure(k + "z"); // other account, still under threshold
    const a = checkLoginLock(k).retryAfterSec;
    for (let i = 0; i < 3; i++) recordLoginFailure(k);
    const b = checkLoginLock(k).retryAfterSec;
    expect(b).toBeGreaterThan(a); // doubling lockout
    expect(checkLoginLock(k + "z").locked).toBe(false);
  });

  it("clears the counter on successful login", () => {
    const k = key("success");
    for (let i = 0; i < 5; i++) recordLoginFailure(k);
    expect(checkLoginLock(k).locked).toBe(true);
    recordLoginSuccess(k);
    expect(checkLoginLock(k).locked).toBe(false);
  });

  it("unknown accounts are never locked", () => {
    const k = key("unknown");
    expect(checkLoginLock(k)).toEqual({ locked: false, retryAfterSec: 0 });
  });
});
