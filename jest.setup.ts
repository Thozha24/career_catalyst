// ─── Universal test mocks ──────────────────────────────────────────────
// Lib modules import `server-only`, the Prisma client and Next's headers API.
// Unit tests target pure rules (password hashing, scoring, validation), so the
// DB layer is stubbed with an inert object — no queries are simulated here.
jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined, delete: () => undefined }),
}));
process.env.JWT_SECRET = "test-secret-that-is-at-least-32-chars-long!!";

// jsdom lacks some primitives our session helpers rely on in tests
import { TextEncoder, TextDecoder } from "util";
if (typeof globalThis.TextEncoder === "undefined") {
  (globalThis as any).TextEncoder = TextEncoder;
  (globalThis as any).TextDecoder = TextDecoder;
}

if (typeof globalThis.crypto === "undefined") {
  // Node's webcrypto
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { webcrypto } = require("crypto");
  (globalThis as any).crypto = webcrypto;
}

if (typeof globalThis.Request === "undefined") {
  // Minimal stubs — unit tests construct plain objects, not real Requests
  (globalThis as any).Request = class Request {
    url: string;
    constructor(url: string) {
      this.url = url;
    }
  };
}
