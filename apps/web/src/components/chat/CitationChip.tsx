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
      className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-blue-100 px-1 align-text-top text-xs font-medium text-blue-700 hover:bg-blue-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
    >
      {citation.marker}
    </button>
  );
}
