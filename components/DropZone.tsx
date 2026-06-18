"use client";

import { useRef, useState, useCallback } from "react";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
]);

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface Props {
  file: File | null;
  onFile: (file: File | null) => void;
}

export default function DropZone({ file, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (f: File | null) => {
      if (!f) return;
      if (!ALLOWED_TYPES.has(f.type) && !/\.(pdf|docx?|txt)$/i.test(f.name)) {
        alert("Supported formats: PDF, DOC, DOCX, TXT");
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        alert("File must be under 10 MB");
        return;
      }
      onFile(f);
    },
    [onFile]
  );

  return (
    <div
      onClick={() => !file && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0] ?? null);
      }}
      className={`relative rounded-xl border-2 border-dashed p-8 transition-colors min-h-[160px] flex items-center justify-center ${
        dragging
          ? "border-violet-500 bg-violet-50"
          : file
          ? "border-violet-300 bg-violet-50/40 cursor-default"
          : "border-slate-300 bg-white hover:border-violet-400 hover:bg-slate-50 cursor-pointer"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {file ? (
        <div className="w-full flex items-start justify-between">
          <div>
            <p className="font-medium text-slate-800 text-sm">{file.name}</p>
            <p className="text-xs text-slate-400 mt-1">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors ml-4 shrink-0"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="text-center pointer-events-none select-none">
          <div className="text-3xl text-slate-300 mb-2">+</div>
          <p className="font-medium text-slate-600 text-sm">Drop resume here or click to browse</p>
          <p className="text-xs text-slate-400 mt-1">PDF · DOC · DOCX · TXT &nbsp;·&nbsp; max 10 MB</p>
        </div>
      )}
    </div>
  );
}
