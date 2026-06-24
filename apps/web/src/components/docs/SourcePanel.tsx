"use client";
import type { Citation } from "@contentmind/core";

export function SourcePanel({
  active,
  onClose,
}: {
  active: Citation | null;
  onClose: () => void;
}) {
  if (!active) {
    return (
      <p className="p-4 text-sm text-neutral-500">
        Click a citation to see its source.
      </p>
    );
  }

  return (
    <div className="p-4" role="region" aria-label="Citation source">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold">{active.documentName}</h2>
        <button
          onClick={onClose}
          aria-label="Close source panel"
          className="rounded p-0.5 text-neutral-400 hover:text-neutral-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          ✕
        </button>
      </div>
      <mark className="mt-2 block rounded bg-yellow-100 p-2 text-sm leading-relaxed">
        {active.quote}
      </mark>
    </div>
  );
}
