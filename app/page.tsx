"use client";

import { useState, useCallback, useEffect } from "react";
import DropZone from "@/components/DropZone";
import JDInput from "@/components/JDInput";
import ReportView from "@/components/ReportView";
import type { AnalyzeResponse } from "@/types";

type Status = "idle" | "analyzing" | "done" | "error";

const LOADING_MESSAGES = [
  "Reading structure, skills, ATS signals…",
  "Scoring against ATS criteria…",
  "Identifying gaps and improvements…",
  "Writing bullet rewrites…",
  "Almost done…",
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJD] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    if (status !== "analyzing") return;
    setLoadingMsgIdx(0);
    const id = setInterval(() => {
      setLoadingMsgIdx((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1));
    }, 4000);
    return () => clearInterval(id);
  }, [status]);

  const analyze = useCallback(async () => {
    if (!file) return;

    setStatus("analyzing");
    setErrorMsg("");
    setResult(null);

    const formData = new FormData();
    formData.append("resume", file);
    if (jd.trim()) formData.append("jd", jd.trim());

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");
      setResult(data as AnalyzeResponse);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unexpected error.");
      setStatus("error");
    }
  }, [file, jd]);

  const reset = useCallback(() => {
    setFile(null);
    setJD("");
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Header */}
        <header className="mb-10 text-center">
          <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-2">
            AI-Powered · Groq LLaMA 3.3
          </p>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Resume Analyser</h1>
          <p className="text-slate-500 max-w-lg mx-auto text-sm leading-relaxed">
            Upload your resume and optionally paste a job description to get ATS scoring,
            gap analysis, and tailored improvement suggestions.
          </p>
        </header>

        {/* Upload + JD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <DropZone file={file} onFile={setFile} />
          <JDInput value={jd} onChange={setJD} />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={analyze}
            disabled={!file || status === "analyzing"}
            className="px-7 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors"
          >
            {status === "analyzing" ? "Analysing…" : "Analyse Resume"}
          </button>
          {status === "done" && (
            <button
              onClick={reset}
              className="px-7 py-2.5 border border-slate-300 hover:border-slate-400 text-slate-600 font-medium rounded-lg text-sm transition-colors"
            >
              Start over
            </button>
          )}
        </div>

        {/* Loading */}
        {status === "analyzing" && (
          <div className="mt-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 text-sm">{LOADING_MESSAGES[loadingMsgIdx]}</p>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Results */}
        {status === "done" && result && (
          <ReportView result={result} hasJD={!!jd.trim()} />
        )}
      </div>
    </main>
  );
}
