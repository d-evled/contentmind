import { describe, it, expect } from "vitest";
import { pickProvider, providerOrder } from "./provider";

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

  // Fail-fast: explicit override with missing key
  it("throws when AI_PROVIDER=google but key is absent", () => {
    expect(() => pickProvider({ AI_PROVIDER: "google" })).toThrow(/AI_PROVIDER=google/);
    expect(() => pickProvider({ AI_PROVIDER: "google" })).toThrow(/GOOGLE_GENERATIVE_AI_API_KEY/);
  });
  it("throws when AI_PROVIDER=groq but key is absent", () => {
    expect(() => pickProvider({ AI_PROVIDER: "groq" })).toThrow(/AI_PROVIDER=groq/);
    expect(() => pickProvider({ AI_PROVIDER: "groq" })).toThrow(/GROQ_API_KEY/);
  });
  it("returns google when AI_PROVIDER=google and key is present", () => {
    expect(pickProvider({ AI_PROVIDER: "google", GOOGLE_GENERATIVE_AI_API_KEY: "x" })).toBe("google");
  });
  it("returns groq when AI_PROVIDER=groq and key is present", () => {
    expect(pickProvider({ AI_PROVIDER: "groq", GROQ_API_KEY: "y" })).toBe("groq");
  });
});

describe("providerOrder", () => {
  it("returns both providers when both keys present, google first", () => {
    expect(
      providerOrder({ GOOGLE_GENERATIVE_AI_API_KEY: "x", GROQ_API_KEY: "y" })
    ).toEqual(["google", "groq"]);
  });
  it("returns [mock] when AI_PROVIDER=mock", () => {
    expect(providerOrder({ AI_PROVIDER: "mock" })).toEqual(["mock"]);
  });
});
