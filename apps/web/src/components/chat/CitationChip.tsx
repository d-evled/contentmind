"use client";
import type { Citation } from "@contentmind/core";

export function CitationChip({
  citation,
  onActivate,
}: {
  citation: Citation;
  onActivate: (c: Citation) => void;
}) {
  return (
    <button
      onClick={() => onActivate(citation)}
      aria-label={`Source ${citation.marker}: ${citation.documentName}`}
      title={citation.documentName}
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] bg-accent-weak px-1 font-mono text-[11px] font-medium text-accent-ink transition-colors duration-150 hover:bg-accent hover:text-paper"
    >
      {citation.marker}
    </button>
  );
}
