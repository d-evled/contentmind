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
      <p className="mx-auto max-w-3xl px-4 py-4 text-sm text-muted sm:px-6">
        Click a citation to see its source.
      </p>
    );
  }

  return (
    <div
      className="mx-auto max-w-3xl px-4 py-3.5 sm:px-6"
      role="region"
      aria-label="Citation source"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-5 shrink-0 place-items-center rounded-[5px] bg-accent-weak font-mono text-[10px] font-medium text-accent-ink">
            {active.marker}
          </span>
          <span className="truncate font-mono text-[12px] tracking-tight text-ink">
            {active.documentName}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close source panel"
          className="grid size-6 shrink-0 place-items-center rounded-[6px] text-faint transition-colors duration-150 hover:bg-paper-2 hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <blockquote className="mt-2.5 border-l-2 border-accent pl-3.5 text-[13.5px] leading-relaxed text-ink-soft">
        {active.quote}
      </blockquote>
    </div>
  );
}
