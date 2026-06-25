"use client";
import ReactMarkdown from "react-markdown";
import type { UIMessage } from "ai";
import { extractCitations, type Chunk, type Citation } from "@contentmind/core";
import { CitationChip } from "./CitationChip";
import { ToolCard, type ToolPart } from "./ToolCard";

interface SearchHit {
  chunkId: string;
  documentId: string;
  documentName: string;
  quote: string;
}

export function Message({
  message,
  onCitationActivate = () => {},
  streaming = false,
}: {
  message: UIMessage;
  onCitationActivate?: (c: Citation) => void;
  streaming?: boolean;
}) {
  // Collect text from all text parts
  const text = message.parts
    .filter((p) => p.type === "text")
    .map((p) => ("text" in p ? p.text : ""))
    .join("");

  // Collect tool parts for ToolCard rendering
  const toolParts = message.parts.filter((p) =>
    p.type.startsWith("tool-")
  ) as unknown as ToolPart[];

  // Build Chunk-shaped sources from searchDocuments output-available parts.
  // SearchHit[] → Chunk[] mapping so extractCitations can correlate [n] markers.
  const searchHits: SearchHit[] = toolParts
    .filter(
      (p) =>
        p.type === "tool-searchDocuments" &&
        p.state === "output-available" &&
        Array.isArray(p.output)
    )
    .flatMap((p) => p.output as SearchHit[]);

  const sources: Chunk[] = searchHits.map((h, i) => ({
    id: h.chunkId,
    documentId: h.documentId,
    documentName: h.documentName,
    index: i,
    content: h.quote,
    embedding: [],
  }));

  const citations =
    message.role === "assistant" ? extractCitations(text, sources) : [];

  // --- User message: a compact right-aligned bubble ---
  if (message.role === "user") {
    return (
      <div className="cm-rise flex justify-end" data-role="user">
        <div className="max-w-[82%] rounded-[var(--radius-md)] rounded-br-md bg-ink px-4 py-2.5 text-[14.5px] leading-relaxed text-paper">
          {text}
        </div>
      </div>
    );
  }

  // --- Assistant message: avatar + tool cards + answer + citations ---
  const showThinking = streaming && text.length === 0 && toolParts.length === 0;

  return (
    <div className="cm-rise flex gap-3.5" data-role="assistant">
      <span
        aria-hidden="true"
        className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[8px] bg-ink text-[12px] font-bold text-paper"
      >
        C
      </span>

      <div className="min-w-0 flex-1">
        {toolParts.map((p) => (
          <ToolCard key={p.toolCallId} part={p} />
        ))}

        {text.length > 0 && (
          <div className="cm-prose">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}

        {showThinking && (
          <span
            className="cm-typing inline-flex items-center pt-1"
            aria-label="Thinking"
            role="status"
          >
            <span />
            <span />
            <span />
          </span>
        )}

        {streaming && text.length > 0 && (
          <span
            className="cm-typing mt-1.5 inline-flex items-center"
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
          </span>
        )}

        {citations.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              Sources
            </span>
            {citations.map((c) => (
              <CitationChip
                key={c.marker}
                citation={c}
                onActivate={onCitationActivate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
