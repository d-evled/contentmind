import { describe, it, expect } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit (fixed window)", () => {
  const limit = 3;
  const windowMs = 60_000;

  it("allows under the limit and reports remaining", () => {
    const r = checkRateLimit([1000, 2000], { now: 3000, limit, windowMs });
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(1);
  });

  it("blocks at the limit", () => {
    const r = checkRateLimit([1000, 1500, 2000], { now: 3000, limit, windowMs });
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it("ignores timestamps outside the window", () => {
    const r = checkRateLimit([1, 2, 3], { now: 100_000, limit, windowMs });
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(3);
  });
});
