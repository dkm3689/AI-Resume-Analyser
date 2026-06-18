import type { AnalyzeResponse, Severity } from "@/types";

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 text-center shadow-sm">
      <div className={`text-5xl font-bold tabular-nums ${scoreColor(score)}`}>{score}</div>
      <div className="text-xs font-medium text-slate-500 mt-2 uppercase tracking-wide">{label}</div>
    </div>
  );
}

const severityStyles: Record<Severity, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

interface Props {
  result: AnalyzeResponse;
  hasJD: boolean;
}

export default function ReportView({ result, hasJD }: Props) {
  const { analysis, model, usage } = result;
  const showJD = hasJD && analysis.jd_match.match_score > 0;

  return (
    <div className="mt-10 space-y-6">

      {/* Meta pill */}
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-mono">{model}</span>
        {usage && <span>{usage.total_tokens?.toLocaleString()} tokens</span>}
      </div>

      {/* Scores */}
      <div className={`grid gap-4 ${showJD ? "grid-cols-3" : "grid-cols-2"}`}>
        <ScoreCard label="Overall Score" score={analysis.overall_score} />
        <ScoreCard label="ATS Readiness" score={analysis.ats_readiness_score} />
        {showJD && <ScoreCard label="JD Match" score={analysis.jd_match.match_score} />}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-2 text-sm uppercase tracking-wide">Summary</h2>
        <p className="text-slate-600 leading-relaxed text-sm">{analysis.summary}</p>
      </div>

      {/* Strengths + Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Strengths</h2>
          <ul className="space-y-2">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Issues</h2>
          <div className="space-y-3">
            {analysis.issues.map((issue, i) => (
              <div key={i} className="border border-slate-100 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityStyles[issue.severity]}`}>
                    {issue.severity}
                  </span>
                  <span className="text-sm font-medium text-slate-800">{issue.title}</span>
                </div>
                <p className="text-xs text-slate-500">{issue.why_it_matters}</p>
                <p className="text-xs text-slate-700 mt-1">
                  <span className="font-medium">Fix:</span> {issue.fix}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Skills Found</h2>
        <div className="space-y-4">
          {analysis.skills.technical.length > 0 && (
            <SkillGroup label="Technical" tags={analysis.skills.technical} colors="bg-violet-100 text-violet-700" />
          )}
          {analysis.skills.tools.length > 0 && (
            <SkillGroup label="Tools" tags={analysis.skills.tools} colors="bg-blue-100 text-blue-700" />
          )}
          {analysis.skills.soft_skills.length > 0 && (
            <SkillGroup label="Soft Skills" tags={analysis.skills.soft_skills} colors="bg-emerald-100 text-emerald-700" />
          )}
          {analysis.skills.missing_or_unclear.length > 0 && (
            <SkillGroup label="Missing / Unclear" tags={analysis.skills.missing_or_unclear} colors="bg-amber-100 text-amber-700" />
          )}
        </div>
      </div>

      {/* JD Match */}
      {showJD && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Job Description Match</h2>
          {analysis.jd_match.role_fit_summary && (
            <p className="text-sm text-slate-600 leading-relaxed mb-4">{analysis.jd_match.role_fit_summary}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {analysis.jd_match.matched_keywords.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Matched</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.jd_match.matched_keywords.map((k, i) => (
                    <span key={i} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {analysis.jd_match.missing_keywords.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">Missing</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.jd_match.missing_keywords.map((k, i) => (
                    <span key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {analysis.jd_match.tailoring_suggestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tailoring Suggestions</p>
              <ul className="space-y-1.5">
                {analysis.jd_match.tailoring_suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <span className="text-violet-400 shrink-0">→</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Suggested Improvements */}
      {analysis.suggested_improvements.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Suggested Improvements</h2>
          <div className="space-y-3">
            {analysis.suggested_improvements.map((item, i) => (
              <div key={i}>
                <p className="text-sm font-medium text-slate-800">{item.area}</p>
                <p className="text-sm text-slate-600 mt-0.5">{item.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bullet Rewrites */}
      {analysis.rewritten_bullets.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Bullet Rewrites</h2>
          <div className="space-y-4">
            {analysis.rewritten_bullets.map((item, i) => (
              <div key={i} className="border border-slate-100 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Before</p>
                    <p className="text-sm text-slate-500">{item.before}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-emerald-500 uppercase mb-1">After</p>
                    <p className="text-sm text-slate-800 font-medium">{item.after}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 italic">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {analysis.next_steps.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Next Steps</h2>
          <ol className="space-y-2">
            {analysis.next_steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700">
                <span className="shrink-0 w-6 h-6 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function SkillGroup({ label, tags, colors }: { label: string; tags: string[]; colors: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, i) => (
          <span key={i} className={`text-xs px-2 py-0.5 rounded font-medium ${colors}`}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
