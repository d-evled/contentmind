"use client";
import { useRef, useState } from "react";

type UploadStatus = "idle" | "uploading" | "done" | "error";

export function DocUpload() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState("Upload failed — please try again");
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setFileName(file.name);
    setStatus("uploading");
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      if (res.ok) {
        setStatus("done");
      } else {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setErrorMsg(data?.error ?? "Upload failed — please try again");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Upload failed — please try again");
      setStatus("error");
    }
  };

  const statusMessage: Record<UploadStatus, string> = {
    idle: "",
    uploading: `Processing ${fileName ?? "file"}…`,
    done: `${fileName ?? "Document"} ready`,
    error: errorMsg,
  };

  return (
    <div className="flex min-h-0 flex-col p-4">
      {/* Labelled dropzone — input is sr-only inside the label so click propagates */}
      <label
        htmlFor="doc-file-input"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) upload(f);
        }}
        className={`group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed p-6 text-center transition-colors duration-150 ${
          dragOver
            ? "border-accent bg-accent-weak"
            : "border-line-strong bg-surface hover:border-accent hover:bg-paper-2/60"
        } ${status === "uploading" ? "pointer-events-none opacity-60" : ""}`}
      >
        <span
          className="grid size-9 place-items-center rounded-[10px] border border-line bg-paper-2 text-accent-ink transition-colors duration-150 group-hover:border-line-strong"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="size-[18px]" fill="none">
            <path
              d="M12 16V8m0 0-3 3m3-3 3 3M6.5 19h11a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 8.6 9.4 4 4 0 0 0 6.5 19Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="text-[13.5px] font-medium text-ink">
          Drop a file or click to upload
        </span>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
          PDF · TXT · MD
        </span>
        <input
          id="doc-file-input"
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
          className="sr-only"
          aria-label="Upload document"
          disabled={status === "uploading"}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            // reset so the same file can be re-uploaded after an error
            e.target.value = "";
          }}
        />
      </label>

      {/* Status announcement — role="status" so screen readers announce changes */}
      <p
        role="status"
        aria-live="polite"
        className={`mt-3 flex min-h-[1.25rem] items-start gap-1.5 text-[12.5px] leading-snug ${
          status === "error"
            ? "text-red-600"
            : status === "done"
              ? "text-ok"
              : "text-muted"
        }`}
      >
        {status === "uploading" && (
          <span
            className="cm-typing mt-1 inline-flex items-center"
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
          </span>
        )}
        <span>{statusMessage[status]}</span>
      </p>

      <p className="mt-auto pt-6 text-[11.5px] leading-relaxed text-faint">
        Tip: use a text-based document. Scanned images have no selectable text to
        read.
      </p>
    </div>
  );
}
