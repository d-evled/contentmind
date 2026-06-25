"use client";

export function JumpToLatest({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Jump to latest message"
      className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[12.5px] text-ink shadow-[var(--shadow-pop)] transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-paper-2"
    >
      Jump to latest
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" aria-hidden="true">
        <path
          d="M12 5v14m0 0-6-6m6 6 6-6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
