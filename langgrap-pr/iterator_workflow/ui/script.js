let rawMarkdown = "";

function setLoading(isLoading) {
  const loader = document.getElementById("loader");
  const responseSection = document.getElementById("responseSection");
  if (isLoading) {
    loader.classList.remove("hidden");
    responseSection.classList.add("hidden");
  } else {
    loader.classList.add("hidden");
    responseSection.classList.remove("hidden");
  }
}

async function generatePost() {
  const topicEl = document.getElementById("topic");
  const topic = topicEl.value;
  if (!topic.trim()) {
    alert("⚠️ Please enter a job topic!");
    topicEl.focus();
    return;
  }

  setLoading(true);
  try {
    const res = await fetch("http://127.0.0.1:8000/generate_job_post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic })
    });

    const data = await res.json();
    rawMarkdown = data.content || "";

    setLoading(false);

    document.getElementById("contentBox").innerHTML = marked.parse(data.content || "");
    document.getElementById("evaluation").innerText = data.evaluation || "";
    document.getElementById("feedback").innerText = data.feedback || "";

    const historyContainer = document.getElementById("historyContainer");
    historyContainer.innerHTML = "";
    const contentHistory = Array.isArray(data.content_history) ? data.content_history : [];
    const feedbackHistory = Array.isArray(data.feedback_history) ? data.feedback_history : [];

    contentHistory.forEach((item, index) => {
      const feedback = feedbackHistory[index] || "No feedback available";
      const card = document.createElement("div");
      card.className = "history-card";
      card.innerHTML = `
        <button class="history-header" data-toggle="${index}">
          <span>📌 Iteration ${index + 1}</span>
          <svg class="history-icon" id="icon-${index}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div id="hist-${index}" class="history-body">
          <div class="prose mt-2">${marked.parse(item || "")}</div>
          <p class="mt-2 text-green-700 font-medium">💡 Feedback: ${feedback}</p>
        </div>`;
      historyContainer.appendChild(card);
    });
  } catch (err) {
    setLoading(false);
    alert("❌ Error generating post. Check backend server.");
    console.error(err);
  }
}

function toggleHistory(index) {
  const el = document.getElementById("hist-" + index);
  const icon = document.getElementById("icon-" + index);
  if (!el) return;
  const isHidden = el.style.display !== "block";
  el.style.display = isHidden ? "block" : "none";
  if (icon) icon.style.transform = isHidden ? "rotate(180deg)" : "rotate(0)";
}

function copyContent(mode) {
  let textToCopy = rawMarkdown || "";
  if (mode === "linkedin") {
    textToCopy = textToCopy
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/###\s/g, "\n")
      .replace(/---/g, "");
  }
  navigator.clipboard.writeText(textToCopy).then(() => {
    alert("✅ Copied to clipboard!");
  });
}

// Wire events
window.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generateBtn");
  if (generateBtn) generateBtn.addEventListener("click", generatePost);

  // Enter key triggers generate
  const topicEl = document.getElementById("topic");
  if (topicEl) {
    topicEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") generatePost();
    });
  }

  // Delegate history toggles and copy buttons
  document.body.addEventListener("click", (e) => {
    const target = e.target;
    if (target && target.closest && target.closest("[data-toggle]")) {
      const btn = target.closest("[data-toggle]");
      const idx = btn.getAttribute("data-toggle");
      toggleHistory(idx);
    }
    if (target && target.closest && target.closest("[data-copy]") ) {
      const btn = target.closest("[data-copy]");
      const mode = btn.getAttribute("data-copy");
      copyContent(mode);
    }
  });
});
