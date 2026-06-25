"use client";
import { useRef, useState } from "react";

type UploadStatus = "idle" | "uploading" | "done" | "error";

export function DocUpload() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setStatus("uploading");
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  const statusMessage: Record<UploadStatus, string> = {
    idle: "",
    uploading: "Processing…",
    done: "Ready ✓",
    error: "Upload failed — please try again",
  };

  return (
    <div className="p-4">
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
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm transition-colors ${
          dragOver
            ? "border-blue-500 bg-blue-50"
            : "border-neutral-300 hover:border-neutral-400"
        } ${status === "uploading" ? "pointer-events-none opacity-60" : ""}`}
      >
        <span className="text-2xl" aria-hidden="true">
          📄
        </span>
        <span className="font-medium text-neutral-700">
          Drop a PDF or text file here
        </span>
        <span className="text-neutral-500">or click to browse</span>
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
        className={`mt-2 min-h-[1.25rem] text-xs ${
          status === "error"
            ? "text-red-600"
            : status === "done"
              ? "text-green-700"
              : "text-neutral-500"
        }`}
      >
        {statusMessage[status]}
      </p>
    </div>
  );
}
