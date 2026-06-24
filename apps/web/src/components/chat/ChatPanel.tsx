"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";

export function ChatPanel() {
  const { messages, sendMessage, status, stop, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const isStreaming = status === "streaming" || status === "submitted";
  return (
    <section
      className="flex min-h-0 flex-1 flex-col"
      aria-label="Chat with your documents"
    >
      <MessageList messages={messages} isStreaming={isStreaming} />
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
