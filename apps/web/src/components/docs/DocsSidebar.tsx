"use client";
import { useEffect } from "react";
import { DocUpload } from "./DocUpload";
import { DocTree } from "./DocTree";
import { useDocuments } from "./useDocuments";

export function DocsSidebar() {
  const controller = useDocuments();
  const { error, clearError } = controller;

  // Auto-dismiss the error toast after a few seconds.
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 4000);
    return () => clearTimeout(t);
  }, [error, clearError]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
          Your documents
        </h2>
      </div>

      <div className="px-4 pt-4">
        <DocUpload onUploaded={controller.refresh} />
      </div>

      <div className="mt-1 min-h-0 flex-1 overflow-y-auto">
        <DocTree controller={controller} />
      </div>

      {error && (
        <div
          role="alert"
          className="cm-rise m-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-danger/30 bg-danger-weak px-3 py-2 text-[12.5px] text-danger"
        >
          <span className="min-w-0 flex-1">{error}</span>
          <button
            onClick={clearError}
            aria-label="Dismiss"
            className="shrink-0 text-danger/70 hover:text-danger"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
