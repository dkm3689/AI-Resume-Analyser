import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(rootDir, "public");

async function loadDotEnv() {
  try {
    const envFile = await readFile(join(rootDir, ".env"), "utf8");
    for (const line of envFile.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

      const [key, ...valueParts] = trimmed.split("=");
      if (!process.env[key]) {
        process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // .env is optional; production hosts usually provide environment variables directly.
  }
}

await loadDotEnv();

const port = Number(process.env.PORT || 3000);
const model = process.env.OPENAI_MODEL || "gpt-5.5";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "overall_score",
    "ats_readiness_score",
    "summary",
    "strengths",
    "issues",
    "skills",
    "suggested_improvements",
    "rewritten_bullets",
    "next_steps"
  ],
  properties: {
    overall_score: { type: "integer", minimum: 0, maximum: 100 },
    ats_readiness_score: { type: "integer", minimum: 0, maximum: 100 },
    summary: { type: "string" },
    strengths: {
      type: "array",
      items: { type: "string" }
    },
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
          fix: { type: "string" }
        }
      }
    },
    skills: {
      type: "object",
      additionalProperties: false,
      required: ["technical", "tools", "soft_skills", "missing_or_unclear"],
      properties: {
        technical: { type: "array", items: { type: "string" } },
        tools: { type: "array", items: { type: "string" } },
        soft_skills: { type: "array", items: { type: "string" } },
        missing_or_unclear: { type: "array", items: { type: "string" } }
      }
    },
    suggested_improvements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["area", "recommendation"],
        properties: {
          area: { type: "string" },
          recommendation: { type: "string" }
        }
      }
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
          reason: { type: "string" }
        }
      }
    },
    next_steps: { type: "array", items: { type: "string" } }
  }
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 18_000_000) {
      throw new Error("Resume file is too large. Please upload a file under 10 MB.");
    }
  }
  return JSON.parse(body || "{}");
}

function getOutputText(response) {
  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  const textParts = [];
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        textParts.push(content.text);
      }
    }
  }
  return textParts.join("");
}

async function analyzeResume(payload) {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY is not set. Add it to your environment before analyzing resumes.");
    error.status = 500;
    throw error;
  }

  const { fileName, mimeType, base64 } = payload;
  if (!fileName || !mimeType || !base64) {
    const error = new Error("Upload a resume file before running the analysis.");
    error.status = 400;
    throw error;
  }

  const allowedTypes = new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain"
  ]);

  if (!allowedTypes.has(mimeType)) {
    const error = new Error("Supported resume formats are PDF, DOC, DOCX, and TXT.");
    error.status = 400;
    throw error;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      instructions:
        "You are a practical resume reviewer and ATS optimization expert. Analyze only the uploaded resume. Be specific, honest, and actionable. Do not invent jobs, education, metrics, or skills that are not visible in the resume. Prefer concise recommendations a candidate can immediately apply.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Analyze this resume without using a job description. Return a strict JSON report that scores general resume quality, ATS readiness, clarity, impact, skills presentation, and rewrite opportunities."
            },
            {
              type: "input_file",
              filename: fileName,
              file_data: `data:${mimeType};base64,${base64}`
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "resume_analysis",
          strict: true,
          schema: analysisSchema
        }
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || "OpenAI analysis failed.";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  const outputText = getOutputText(data);
  if (!outputText) {
    const error = new Error("The model returned an empty analysis.");
    error.status = 502;
    throw error;
  }

  return {
    analysis: JSON.parse(outputText),
    usage: data.usage || null,
    model
  };
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const file = await readFile(filePath);
    res.writeHead(200, {
      "content-type": mimeTypes[extname(filePath)] || "application/octet-stream"
    });
    res.end(file);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/analyze") {
      const payload = await readJsonBody(req);
      const result = await analyzeResume(payload);
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "GET" || req.method === "HEAD") {
      await serveStatic(req, res);
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message || "Unexpected server error" });
  }
});

server.listen(port, () => {
  console.log(`AI Resume Analyser running at http://localhost:${port}`);
});
