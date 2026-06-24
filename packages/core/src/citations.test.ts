import { describe, it, expect } from "vitest";
import { extractCitations } from "./citations";
import type { Chunk } from "./types";

const chunk = (id: string, name: string, content: string): Chunk => ({
  id,
  documentId: "d-" + id,
  documentName: name,
  index: 0,
  content,
  embedding: []
});

describe("extractCitations", () => {
  const sources = [chunk("1", "a.pdf", "first source"), chunk("2", "b.pdf", "second source")];

  it("maps [n] markers to the matching retrieved chunk", () => {
    const cites = extractCitations("The sky is blue [1] and grass is green [2].", sources);
    expect(cites).toEqual([
      { marker: 1, chunkId: "1", documentId: "d-1", documentName: "a.pdf", quote: "first source" },
      { marker: 2, chunkId: "2", documentId: "d-2", documentName: "b.pdf", quote: "second source" }
    ]);
  });

  it("deduplicates repeated markers and ignores out-of-range ones", () => {
    const cites = extractCitations("see [1] and again [1] but not [9]", sources);
    expect(cites.map((c) => c.marker)).toEqual([1]);
  });

  it("returns empty array when there are no markers", () => {
    expect(extractCitations("no citations here", sources)).toEqual([]);
  });
});
