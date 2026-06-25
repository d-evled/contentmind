export interface ChunkOptions {
  size?: number;
  overlap?: number;
}

/**
 * Splits text into overlapping fixed-size character windows.
 * Trims each window and drops empty results.
 */
export function chunkText(text: string, opts: ChunkOptions = {}): string[] {
  const size = opts.size ?? 1000;
  const overlap = opts.overlap ?? 150;
  if (overlap < 0) throw new Error("overlap must be non-negative");
  if (overlap >= size) throw new Error("overlap must be smaller than size");

  const trimmed = text.trim();
  if (trimmed.length <= size) return trimmed.length ? [trimmed] : [];

  const step = size - overlap;
  const chunks: string[] = [];
  for (let start = 0; start < trimmed.length; start += step) {
    const piece = trimmed.slice(start, start + size).trim();
    if (piece.length) chunks.push(piece);
    if (start + size >= trimmed.length) break;
  }
  return chunks;
}
