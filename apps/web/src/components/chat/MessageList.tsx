"use client";
import { useEffect, useRef, useState } from "react";
import { computeScrollState, type Citation } from "@contentmind/core";
import type { UIMessage } from "ai";
import { Message } from "./Message";
import { JumpToLatest } from "./JumpToLatest";

export function MessageList({
  messages,
  isStreaming,
  onCitationActivate = () => {},
}: {
  messages: UIMessage[];
  isStreaming: boolean;
  onCitationActivate?: (c: Citation) => void;
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

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={ref}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Conversation"
        className="h-full overflow-y-auto px-4 py-6"
      >
        <ol className="mx-auto flex max-w-2xl flex-col gap-6">
          {messages.map((m) => (
            <li key={m.id}>
              <Message message={m} onCitationActivate={onCitationActivate} />
            </li>
          ))}
        </ol>
      </div>
      {showJump && <JumpToLatest onClick={scrollToBottom} />}
    </div>
  );
}
