"use client";
import type { UIMessage } from "ai";

export function Message({ message }: { message: UIMessage }) {
  const text = message.parts
    .filter((p) => p.type === "text")
    .map((p) => ("text" in p ? p.text : ""))
    .join("");
  return (
    <div data-role={message.role} className="whitespace-pre-wrap">
      {text}
    </div>
  );
}
