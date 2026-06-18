import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { PDFParse } from "pdf-parse";
import { analysisSchema } from "@/lib/schema";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
]);

const MODEL = "llama-3.3-70b-versatile";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Could not parse form data." }, { status: 400 });
  }

  const file = formData.get("resume") as File | null;
  const jd = ((formData.get("jd") as string | null) ?? "").trim();

  if (!file) {
    return NextResponse.json({ error: "No resume file provided." }, { status: 400 });
  }

  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: "Supported formats: PDF, DOC, DOCX, TXT." },
      { status: 400 }
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 10 MB." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Extract plain text from all file types (Groq is text-only)
  let resumeText: string;
  try {
    if (mimeType === "application/pdf") {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      resumeText = result.text;
    } else if (mimeType === "text/plain") {
      resumeText = buffer.toString("utf-8");
    } else {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.extractRawText({ buffer });
      resumeText = value;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read file.";
    return NextResponse.json({ error: `Could not extract text: ${message}` }, { status: 422 });
  }

  if (!resumeText.trim()) {
    return NextResponse.json(
      { error: "Could not extract any text from the file. Try a different format." },
      { status: 422 }
    );
  }

  const schemaStr = JSON.stringify(analysisSchema, null, 2);

  const systemPrompt = jd
    ? `You are an expert resume reviewer and ATS specialist. Analyze the resume against the provided job description. Be specific, honest, and actionable — do not invent information not present in the resume. Populate all jd_match fields accurately.\n\nRespond ONLY with a valid JSON object matching this schema:\n${schemaStr}`
    : `You are an expert resume reviewer and ATS specialist. Analyze the resume for general quality and ATS readiness. Be specific and actionable. Since no job description was provided, set jd_match.match_score to 0, leave matched_keywords, missing_keywords, and tailoring_suggestions as empty arrays, and set role_fit_summary to an empty string.\n\nRespond ONLY with a valid JSON object matching this schema:\n${schemaStr}`;

  const userText = jd
    ? `Analyze this resume against the following job description.\n\nRESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jd}`
    : `Analyze this resume for general quality, ATS readiness, clarity, impact, and improvement opportunities.\n\nRESUME:\n${resumeText}`;

  try {
    const client = new Groq({ apiKey });
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4096,
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const analysis = JSON.parse(raw);

    return NextResponse.json({
      analysis,
      model: MODEL,
      usage: response.usage ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
