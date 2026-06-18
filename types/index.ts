export type Severity = "low" | "medium" | "high";

export interface Issue {
  title: string;
  severity: Severity;
  why_it_matters: string;
  fix: string;
}

export interface Skills {
  technical: string[];
  tools: string[];
  soft_skills: string[];
  missing_or_unclear: string[];
}

export interface JDMatch {
  match_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  role_fit_summary: string;
  tailoring_suggestions: string[];
}

export interface BulletRewrite {
  before: string;
  after: string;
  reason: string;
}

export interface Improvement {
  area: string;
  recommendation: string;
}

export interface Analysis {
  overall_score: number;
  ats_readiness_score: number;
  summary: string;
  strengths: string[];
  issues: Issue[];
  skills: Skills;
  jd_match: JDMatch;
  suggested_improvements: Improvement[];
  rewritten_bullets: BulletRewrite[];
  next_steps: string[];
}

export interface AnalyzeResponse {
  analysis: Analysis;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  } | null;
}
