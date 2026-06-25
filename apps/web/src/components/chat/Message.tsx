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
}: {
  message: UIMessage;
  onCitationActivate?: (c: Citation) => void;
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

  return (
    <div
      data-role={message.role}
      className={
        message.role === "user"
          ? "ml-auto max-w-[80%] rounded-2xl bg-neutral-100 px-4 py-2"
          : "max-w-none"
      }
    >
      {toolParts.map((p) => (
        <ToolCard key={p.toolCallId} part={p} />
      ))}
      <div className="prose prose-neutral max-w-none">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
      {citations.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
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
  );
}
