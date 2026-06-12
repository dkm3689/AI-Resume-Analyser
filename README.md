# AI Resume Analyser

A resume-only MVP that uploads a resume, sends it to the OpenAI Responses API, and renders a structured analysis report.

## Features

- Resume upload for PDF, DOC, DOCX, and TXT files
- Overall resume score and ATS readiness score
- Strengths, issues, detected skills, improvements, bullet rewrites, and next steps
- Structured JSON output from the model for reliable UI rendering
- No database; uploaded resumes are not stored by this app

## Setup

1. Use Node.js 18 or newer.
2. Set your API key:

```bash
export OPENAI_API_KEY="your_api_key_here"
```

3. Optionally set a model:

```bash
export OPENAI_MODEL="gpt-5.5"
```

4. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Notes

This first version analyzes only the resume. A job-description matching mode can be added next by extending the form and prompt.
