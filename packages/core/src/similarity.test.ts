import { describe, it, expect } from "vitest";
import { cosineSimilarity, rankChunks } from "./similarity";
import type { Chunk } from "./types";

const chunk = (id: string, embedding: number[]): Chunk => ({
  id,
  documentId: "d1",
  documentName: "doc",
  index: 0,
  content: id,
  embedding
});

describe("cosineSimilarity", () => {
  it("is 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
  });
  it("is 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });
  it("throws on length mismatch", () => {
    expect(() => cosineSimilarity([1], [1, 2])).toThrow();
  });
});

describe("rankChunks", () => {
  it("returns top-k by descending similarity", () => {
    const q = [1, 0];
    const chunks = [
      chunk("far", [0, 1]),
      chunk("near", [0.9, 0.1]),
      chunk("mid", [0.6, 0.6])
    ];
    const ranked = rankChunks(q, chunks, 2);
    expect(ranked.map((r) => r.chunk.id)).toEqual(["near", "mid"]);
    expect(ranked[0]!.score).toBeGreaterThan(ranked[1]!.score);
  });
});
