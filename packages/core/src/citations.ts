import type { Chunk, Citation } from "./types";

/**
 * Parses [n] citation markers from an assistant answer and maps each unique,
 * in-range marker to the 1-based retrieved source chunk.
 */
export function extractCitations(answer: string, sources: Chunk[]): Citation[] {
  const seen = new Set<number>();
  const citations: Citation[] = [];
  const re = /\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(answer)) !== null) {
    const marker = Number(match[1]);
    if (seen.has(marker)) continue;
    const source = sources[marker - 1];
    if (!source) continue;
    seen.add(marker);
    citations.push({
      marker,
      chunkId: source.id,
      documentId: source.documentId,
      documentName: source.documentName,
      quote: source.content
    });
  }
  return citations;
}
