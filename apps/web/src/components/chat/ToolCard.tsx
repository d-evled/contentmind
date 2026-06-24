"use client";

interface SearchHit {
  chunkId: string;
  documentName: string;
  quote: string;
}

export interface ToolPart {
  type: string;       // e.g. "tool-searchDocuments"
  toolCallId: string;
  state: string;      // "input-streaming" | "input-available" | "output-available" | "output-error"
  input?: unknown;
  output?: unknown;
  errorText?: string;
}

export function ToolCard({ part }: { part: ToolPart }) {
  const name = part.type.replace(/^tool-/, "");
  const running = part.state === "input-streaming" || part.state === "input-available";
  const errored = part.state === "output-error";
  const label =
    name === "searchDocuments" ? "Searching documents" : "Extracting fields";

  return (
    <div className="my-2 rounded-xl border bg-neutral-50 p-3 text-sm">
      <div className="flex items-center gap-2 font-medium">
        {running ? (
          <span
            role="status"
            aria-label={`${label}…`}
            className="inline-block size-3 animate-pulse rounded-full bg-blue-500"
          />
        ) : !errored ? (
          <span
            aria-hidden="true"
            className="inline-block size-3 rounded-full bg-green-500"
          />
        ) : null}
        {running ? `${label}…` : `${label} — done`}
      </div>
      {part.state === "output-available" && name === "searchDocuments" && (
        <ul className="mt-2 space-y-1">
          {(part.output as SearchHit[]).map((h) => (
            <li key={h.chunkId} className="rounded border bg-white p-2">
              <span className="font-medium">{h.documentName}</span>
              <span className="block text-neutral-600">{h.quote}</span>
            </li>
          ))}
        </ul>
      )}
      {part.state === "output-error" && (
        <p className="mt-1 text-red-600">{part.errorText ?? "Tool call failed"}</p>
      )}
    </div>
  );
}
