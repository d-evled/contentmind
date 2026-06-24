import { describe, it, expect } from "vitest";
import { pickProvider } from "./provider";

describe("pickProvider", () => {
  it("defaults to google when key present and no override", () => {
    expect(pickProvider({ GOOGLE_GENERATIVE_AI_API_KEY: "x" })).toBe("google");
  });
  it("honors AI_PROVIDER override", () => {
    expect(pickProvider({ AI_PROVIDER: "groq", GROQ_API_KEY: "y" })).toBe("groq");
  });
  it("returns mock when AI_PROVIDER=mock (no keys needed)", () => {
    expect(pickProvider({ AI_PROVIDER: "mock" })).toBe("mock");
  });
  it("falls back to groq when only groq key present", () => {
    expect(pickProvider({ GROQ_API_KEY: "y" })).toBe("groq");
  });
  it("throws when no provider is configured", () => {
    expect(() => pickProvider({})).toThrow(/no AI provider/i);
  });
});
