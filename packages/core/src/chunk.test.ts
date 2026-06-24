import { describe, it, expect } from "vitest";
import { chunkText } from "./chunk";

describe("chunkText", () => {
  it("returns a single chunk for short text", () => {
    expect(chunkText("hello world", { size: 100, overlap: 10 })).toEqual([
      "hello world"
    ]);
  });

  it("splits long text into overlapping chunks of ~size", () => {
    const text = "a".repeat(250);
    const chunks = chunkText(text, { size: 100, overlap: 20 });
    expect(chunks.length).toBe(3);
    expect(chunks[0]!.length).toBe(100);
    // overlap: chunk 2 starts 80 chars in (size - overlap)
    expect(chunks[1]!.startsWith("a".repeat(100))).toBe(true);
  });

  it("never emits empty or whitespace-only chunks", () => {
    const chunks = chunkText("   \n\n   word   ", { size: 5, overlap: 0 });
    expect(chunks.every((c) => c.trim().length > 0)).toBe(true);
  });

  it("uses sensible defaults", () => {
    expect(chunkText("short")).toEqual(["short"]);
  });
});
