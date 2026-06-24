"use client";

export function JumpToLatest({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border bg-white px-4 py-1.5 text-sm shadow"
    >
      Jump to latest ↓
    </button>
  );
}
