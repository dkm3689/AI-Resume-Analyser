const form = document.querySelector("#resumeForm");
const input = document.querySelector("#resumeInput");
const dropzone = document.querySelector("#dropzone");
const fileRow = document.querySelector("#fileRow");
const fileName = document.querySelector("#fileName");
const fileMeta = document.querySelector("#fileMeta");
const clearButton = document.querySelector("#clearButton");
const analyzeButton = document.querySelector("#analyzeButton");
const emptyState = document.querySelector("#emptyState");
const loadingState = document.querySelector("#loadingState");
const errorState = document.querySelector("#errorState");
const errorText = document.querySelector("#errorText");
const report = document.querySelector("#report");
const modelPill = document.querySelector("#modelPill");

let selectedFile = null;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function setVisible(element, visible) {
  element.hidden = !visible;
}

function showState(state) {
  setVisible(emptyState, state === "empty");
  setVisible(loadingState, state === "loading");
  setVisible(errorState, state === "error");
  setVisible(report, state === "report");
}

function setFile(file) {
  selectedFile = file;
  analyzeButton.disabled = !file;

  if (!file) {
    fileRow.hidden = true;
    input.value = "";
    return;
  }

  fileName.textContent = file.name;
  fileMeta.textContent = `${file.type || "document"} - ${formatBytes(file.size)}`;
  fileRow.hidden = false;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    });
    reader.addEventListener("error", () => reject(new Error("Could not read the selected file.")));
    reader.readAsDataURL(file);
  });
}

function listItems(items) {
  return (items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderAnalysis(data) {
  document.querySelector("#overallScore").textContent = data.overall_score;
  document.querySelector("#atsScore").textContent = data.ats_readiness_score;
  document.querySelector("#summary").textContent = data.summary;
  document.querySelector("#strengthsList").innerHTML = listItems(data.strengths);

  document.querySelector("#issuesList").innerHTML = data.issues
    .map(
      (issue) => `
        <article class="issue">
          <span class="severity ${escapeHtml(issue.severity)}">${escapeHtml(issue.severity)}</span>
          <strong>${escapeHtml(issue.title)}</strong>
          <p>${escapeHtml(issue.why_it_matters)}</p>
          <p><b>Fix:</b> ${escapeHtml(issue.fix)}</p>
        </article>
      `
    )
    .join("");

  const skills = [
    ...data.skills.technical,
    ...data.skills.tools,
    ...data.skills.soft_skills,
    ...data.skills.missing_or_unclear.map((skill) => `Unclear: ${skill}`)
  ];
  document.querySelector("#skillsList").innerHTML = skills
    .map((skill) => `<span class="tag">${escapeHtml(skill)}</span>`)
    .join("");

  document.querySelector("#improvementsList").innerHTML = data.suggested_improvements
    .map(
      (item) => `
        <article class="improvement">
          <strong>${escapeHtml(item.area)}</strong>
          <p>${escapeHtml(item.recommendation)}</p>
        </article>
      `
    )
    .join("");

  document.querySelector("#rewritesList").innerHTML = data.rewritten_bullets
    .map(
      (item) => `
        <article class="rewrite">
          <strong>Before</strong>
          <p class="before">${escapeHtml(item.before)}</p>
          <strong>After</strong>
          <p class="after">${escapeHtml(item.after)}</p>
          <p>${escapeHtml(item.reason)}</p>
        </article>
      `
    )
    .join("");

  document.querySelector("#nextStepsList").innerHTML = listItems(data.next_steps);
}

input.addEventListener("change", () => {
  setFile(input.files[0] || null);
});

clearButton.addEventListener("click", () => {
  setFile(null);
  showState("empty");
});

for (const eventName of ["dragenter", "dragover"]) {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add("dragging");
  });
}

for (const eventName of ["dragleave", "drop"]) {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.remove("dragging");
  });
}

dropzone.addEventListener("drop", (event) => {
  const file = event.dataTransfer.files[0];
  if (file) {
    input.files = event.dataTransfer.files;
    setFile(file);
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!selectedFile) return;

  if (selectedFile.size > 10 * 1024 * 1024) {
    errorText.textContent = "Please upload a file under 10 MB.";
    showState("error");
    return;
  }

  analyzeButton.disabled = true;
  analyzeButton.textContent = "Analyzing...";
  showState("loading");

  try {
    const base64 = await fileToBase64(selectedFile);
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileName: selectedFile.name,
        mimeType: selectedFile.type || "application/octet-stream",
        base64
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Analysis failed.");
    }

    renderAnalysis(payload.analysis);
    modelPill.textContent = payload.model;
    showState("report");
  } catch (error) {
    errorText.textContent = error.message;
    showState("error");
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.textContent = "Analyze resume";
  }
});
