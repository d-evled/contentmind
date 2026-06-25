"use client";

interface SearchHit {
  chunkId: string;
  documentName: string;
  quote: string;
}

export interface ToolPart {
  type: string; // e.g. "tool-searchDocuments"
  toolCallId: string;
  state: string; // "input-streaming" | "input-available" | "output-available" | "output-error"
  input?: unknown;
  output?: unknown;
  errorText?: string;
}

function ToolIcon({ name }: { name: string }) {
  if (name === "searchDocuments") {
    return (
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.7" />
        <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" aria-hidden="true">
      <path
        d="M8 4H6a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2h-2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ToolCard({ part }: { part: ToolPart }) {
  const name = part.type.replace(/^tool-/, "");
  const running =
    part.state === "input-streaming" || part.state === "input-available";
  const errored = part.state === "output-error";
  const label =
    name === "searchDocuments" ? "Searching documents" : "Extracting fields";
  const hits =
    part.state === "output-available" && Array.isArray(part.output)
      ? (part.output as SearchHit[])
      : [];

  return (
    <div className="my-3 overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface">
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2.5 ${running ? "cm-scan" : ""}`}
      >
        <span className="grid size-6 place-items-center rounded-[7px] bg-accent-weak text-accent-ink">
          <ToolIcon name={name} />
        </span>
        <span className="font-mono text-[12.5px] tracking-tight text-ink">
          {running ? `${label}…` : label}
        </span>

        {running ? (
          <span
            role="status"
            aria-label={`${label}…`}
            className="cm-typing ml-auto inline-flex items-center"
          >
            <span />
            <span />
            <span />
          </span>
        ) : !errored ? (
          <span className="ml-auto flex items-center gap-1 font-mono text-[11px] text-ok">
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" aria-hidden="true">
              <path
                d="m5 12 5 5L20 7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {hits.length > 0 ? `${hits.length} found` : "done"}
          </span>
        ) : null}
      </div>

      {hits.length > 0 && (
        <ul className="space-y-1.5 border-t border-line bg-paper-2/40 p-2.5">
          {hits.map((h) => (
            <li
              key={h.chunkId}
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2"
            >
              <span className="font-mono text-[11px] tracking-tight text-accent-ink">
                {h.documentName}
              </span>
              <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug text-muted">
                {h.quote}
              </span>
            </li>
          ))}
        </ul>
      )}

      {errored && (
        <p className="border-t border-line px-3.5 py-2 text-[12.5px] text-red-600">
          {part.errorText ?? "Tool call failed"}
        </p>
      )}
    </div>
  );
}
