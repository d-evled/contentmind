"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useCallback } from "react";
import type { Citation } from "@contentmind/core";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import { SourcePanel } from "@/components/docs/SourcePanel";

export function ChatPanel() {
  const { messages, sendMessage, status, stop, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const isStreaming = status === "streaming" || status === "submitted";

  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  // Dismiss source panel on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeCitation) {
        setActiveCitation(null);
      }
    },
    [activeCitation]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <section
      className="flex min-h-0 flex-1 flex-col"
      aria-label="Chat with your documents"
    >
      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        onCitationActivate={setActiveCitation}
      />
      {activeCitation && (
        <div className="border-t bg-white shadow-sm">
          <SourcePanel
            active={activeCitation}
            onClose={() => setActiveCitation(null)}
          />
        </div>
      )}
      <Composer
        onSend={(text) => sendMessage({ text })}
        onStop={stop}
        onRegenerate={regenerate}
        isStreaming={isStreaming}
        canRegenerate={messages.length > 0}
      />
    </section>
  );
}
