"use client";
import { useEffect, useRef, useState } from "react";
import { computeScrollState, type Citation } from "@contentmind/core";
import type { UIMessage } from "ai";
import { Message } from "./Message";
import { JumpToLatest } from "./JumpToLatest";

const EXAMPLES = [
  "Summarize this document in three bullets.",
  "What are the key dates or deadlines?",
  "What obligations does it place on me?",
];

function EmptyState({ onExample }: { onExample?: (text: string) => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 pt-[11vh] text-center">
      <span
        className="cm-rise grid size-12 place-items-center rounded-2xl border border-line bg-surface text-accent shadow-[var(--shadow-soft)]"
        style={{ animationDelay: "40ms" }}
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
          <path
            d="M12 3v4m0 10v4m9-9h-4M7 12H3m13.5-5.5-2.8 2.8M9.3 14.7l-2.8 2.8m11 0-2.8-2.8M9.3 9.3 6.5 6.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <h1
        className="cm-rise mt-6 font-display text-[2.1rem] leading-tight tracking-[-0.01em]"
        style={{ animationDelay: "110ms" }}
      >
        Ask your documents anything
      </h1>
      <p
        className="cm-rise mt-3 max-w-md text-[15px] leading-relaxed text-muted"
        style={{ animationDelay: "180ms" }}
      >
        Upload a file on the left, then ask a question. Every answer comes with
        citations you can trace back to the source passage.
      </p>
      {onExample && (
        <div
          className="cm-rise mt-8 flex flex-wrap justify-center gap-2"
          style={{ animationDelay: "260ms" }}
        >
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => onExample(ex)}
              className="rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] text-ink-soft transition-colors duration-150 hover:border-line-strong hover:bg-paper-2"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function MessageList({
  messages,
  isStreaming,
  onCitationActivate = () => {},
  onExample,
}: {
  messages: UIMessage[];
  isStreaming: boolean;
  onCitationActivate?: (c: Citation) => void;
  onExample?: (text: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [showJump, setShowJump] = useState(false);

  const scrollToBottom = () => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const s = computeScrollState({
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    });
    setShowJump(s.showJumpButton);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const s = computeScrollState({
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    });
    if (s.shouldAutoScroll) scrollToBottom();
  }, [messages, isStreaming]);

  const isEmpty = messages.length === 0;

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={ref}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Conversation"
        className="h-full overflow-y-auto px-4 py-8 sm:px-6"
      >
        {isEmpty ? (
          <EmptyState onExample={onExample} />
        ) : (
          <ol className="mx-auto flex max-w-3xl flex-col gap-8">
            {messages.map((m, i) => (
              <li key={m.id}>
                <Message
                  message={m}
                  onCitationActivate={onCitationActivate}
                  streaming={
                    isStreaming &&
                    i === messages.length - 1 &&
                    m.role === "assistant"
                  }
                />
              </li>
            ))}
          </ol>
        )}
      </div>
      {showJump && <JumpToLatest onClick={scrollToBottom} />}
    </div>
  );
}
