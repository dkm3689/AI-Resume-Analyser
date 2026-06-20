interface Props {
  value: string;
  onChange: (v: string) => void;
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function JDInput({ value, onChange }: Props) {
  const words = wordCount(value);
  return (
    <div className="flex flex-col rounded-xl border-2 border-dashed border-slate-300 bg-white p-4 hover:border-violet-300 transition-colors min-h-[160px]">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-700">
          Job Description{" "}
          <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <div className="flex items-center gap-3">
          {words > 0 && (
            <span className="text-xs text-slate-400">{words} words</span>
          )}
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the job description here to get a match score and gap analysis…"
        className="flex-1 resize-none outline-none text-sm text-slate-700 placeholder-slate-400 leading-relaxed"
      />
    </div>
  );
}
