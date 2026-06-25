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
      className="border-t border-line bg-paper/85 px-4 py-3 backdrop-blur-sm sm:px-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="mx-auto max-w-3xl">
        {(isStreaming || canRegenerate) && (
          <div className="mb-2 flex justify-center">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] text-muted shadow-[var(--shadow-soft)] transition-colors duration-150 hover:text-ink"
              >
                <span className="size-2 rounded-[2px] bg-ink" />
                Stop generating
              </button>
            ) : (
              <button
                type="button"
                onClick={onRegenerate}
                className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] text-muted shadow-[var(--shadow-soft)] transition-colors duration-150 hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" aria-hidden="true">
                  <path
                    d="M3 12a9 9 0 1 0 3-6.7M3 4v3.5h3.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Regenerate
              </button>
            )}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex flex-1 items-center rounded-[var(--radius-lg)] border border-line bg-surface px-3.5 shadow-[var(--shadow-soft)] transition-colors duration-150 focus-within:border-accent">
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
              disabled={isStreaming}
              className="max-h-44 flex-1 resize-none bg-transparent py-3 text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint disabled:opacity-60 [field-sizing:content]"
            />
          </div>

          <button
            type="submit"
            disabled={!text.trim() || isStreaming}
            aria-label="Send message"
            className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-md)] bg-accent text-paper shadow-[var(--shadow-soft)] transition-all duration-150 enabled:hover:bg-accent-ink enabled:active:scale-95 disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
              <path
                d="M12 19V5m0 0-6 6m6-6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <p className="mt-2 text-center font-mono text-[10.5px] text-faint">
          Enter to send · Shift + Enter for a new line
        </p>
      </div>
    </form>
  );
}
