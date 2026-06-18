// JSON Schema used as Claude tool input_schema — additionalProperties: false and all fields
// in required guarantees a typed, predictable response every time.
export const analysisSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "overall_score",
    "ats_readiness_score",
    "summary",
    "strengths",
    "issues",
    "skills",
    "jd_match",
    "suggested_improvements",
    "rewritten_bullets",
    "next_steps",
  ],
  properties: {
    overall_score: { type: "integer", minimum: 0, maximum: 100 },
    ats_readiness_score: { type: "integer", minimum: 0, maximum: 100 },
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    issues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "severity", "why_it_matters", "fix"],
        properties: {
          title: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          why_it_matters: { type: "string" },
          fix: { type: "string" },
        },
      },
    },
    skills: {
      type: "object",
      additionalProperties: false,
      required: ["technical", "tools", "soft_skills", "missing_or_unclear"],
      properties: {
        technical: { type: "array", items: { type: "string" } },
        tools: { type: "array", items: { type: "string" } },
        soft_skills: { type: "array", items: { type: "string" } },
        missing_or_unclear: { type: "array", items: { type: "string" } },
      },
    },
    jd_match: {
      type: "object",
      additionalProperties: false,
      required: [
        "match_score",
        "matched_keywords",
        "missing_keywords",
        "role_fit_summary",
        "tailoring_suggestions",
      ],
      properties: {
        match_score: { type: "integer", minimum: 0, maximum: 100 },
        matched_keywords: { type: "array", items: { type: "string" } },
        missing_keywords: { type: "array", items: { type: "string" } },
        role_fit_summary: { type: "string" },
        tailoring_suggestions: { type: "array", items: { type: "string" } },
      },
    },
    suggested_improvements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["area", "recommendation"],
        properties: {
          area: { type: "string" },
          recommendation: { type: "string" },
        },
      },
    },
    rewritten_bullets: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["before", "after", "reason"],
        properties: {
          before: { type: "string" },
          after: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
    next_steps: { type: "array", items: { type: "string" } },
  },
};
