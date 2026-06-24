"use client";
import { useState } from "react";

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  onRegenerate: () => void;
  isStreaming: boolean;
  canRegenerate: boolean;
}

export function Composer({
  onSend,
  onStop,
  onRegenerate,
  isStreaming,
  canRegenerate,
}: Props) {
  const [text, setText] = useState("");
  const submit = () => {
    const t = text.trim();
    if (!t || isStreaming) return;
    onSend(t);
    setText("");
  };
  return (
    <form
      className="flex items-end gap-2 border-t p-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor="composer" className="sr-only">
        Message
      </label>
      <textarea
        id="composer"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={1}
        placeholder="Ask about your documents…"
        className="min-h-11 flex-1 resize-none rounded-xl border px-3 py-2"
      />
      {isStreaming ? (
        <button
          type="button"
          onClick={onStop}
          className="rounded-xl border px-4 py-2"
        >
          Stop
        </button>
      ) : (
        <>
          {canRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              className="rounded-xl border px-3 py-2"
            >
              Regenerate
            </button>
          )}
          <button
            type="submit"
            disabled={!text.trim()}
            className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-40"
          >
            Send
          </button>
        </>
      )}
    </form>
  );
}
