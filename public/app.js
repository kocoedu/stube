import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBaA-3e8eRcmaAyNTR35NqS43v7zlYyb1c",
  authDomain: "app-feedback-b36c4.firebaseapp.com",
  projectId: "app-feedback-b36c4",
  storageBucket: "app-feedback-b36c4.firebasestorage.app",
  messagingSenderId: "793262622057",
  appId: "1:793262622057:web:b665df4af083dd9c9869f8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initOnboardingForm();
  initAIChat();
  initFeedbackSystem();
  registerServiceWorker();
});

function initNavigation() {
  const tabs = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-tab");

      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(`tab-${target}`).classList.add("active");
    });
  });
}

function initOnboardingForm() {
  const form = document.getElementById("onboardingForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const grade = document.getElementById("userGrade").value;
    const level = document.getElementById("userLevel").value;
    const queryText = document.getElementById("userQuery").value.trim();

    switchTab("report");

    const loader = document.getElementById("reportLoader");
    const resultDiv = document.getElementById("reportResult");

    loader.classList.remove("hidden");
    resultDiv.innerHTML = "";

    try {
      const response = await fetch(`/api/generate?grade=${encodeURIComponent(grade)}&level=${encodeURIComponent(level)}&query=${encodeURIComponent(queryText)}`);
      const data = await response.json();

      loader.classList.add("hidden");

      if (data.result) {
        renderReportResult(data.result);
      } else {
        resultDiv.innerHTML = `<p class="empty-state">분석 결과를 가져오지 못했습니다. 오류: ${data.error || '알 수 없음'}</p>`;
      }
    } catch (error) {
      loader.classList.add("hidden");
      resultDiv.innerHTML = `<p class="empty-state">서버 통신 중 오류가 발생했습니다.</p>`;
    }
  });
}

function renderReportResult(rawText) {
  const resultDiv = document.getElementById("reportResult");
  const lines = rawText.split('\n');
  let html = "";

  lines.forEach(line => {
    if (line.trim().length === 0) return;
    
    if (line.includes("추천") || line.includes("분석") || line.includes("전략")) {
      html += `<div class="report-section-block stat"><strong>${escapeHtml(line)}</strong></div>`;
    } else {
      html += `<p style="margin-bottom:8px;">${escapeHtml(line)}</p>`;
    }
  });

  resultDiv.innerHTML = html;
}

function initAIChat() {
  const sendBtn = document.getElementById("chatSendBtn");
  const chatInput = document.getElementById("chatInput");

  sendBtn.addEventListener("click", () => handleChatMessage());
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleChatMessage();
  });
}

async function handleChatMessage() {
  const chatInput = document.getElementById("chatInput");
  const messageContainer = document.getElementById("chatMessages");
  const text = chatInput.value.trim();

  if (!text) return;

  appendChatBubble(text, "user");
  chatInput.value = "";

  const botBubble = appendChatBubble("답변을 생각하는 중입니다...", "bot");

  try {
    const response = await fetch(`/api/generate?query=${encodeURIComponent(text)}`);
    const data = await response.json();

    if (data.result) {
      botBubble.innerText = data.result;
    } else {
      botBubble.innerText = "죄송합니다. 답변을 생성할 수 없습니다.";
    }
  } catch (error) {
    botBubble.innerText = "통신 오류가 발생했습니다.";
  }

  messageContainer.scrollTop = messageContainer.scrollHeight;
}

function appendChatBubble(text, sender) {
  const messageContainer = document.getElementById("chatMessages");
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${sender}`;
  bubble.innerText = text;
  messageContainer.appendChild(bubble);
  messageContainer.scrollTop = messageContainer.scrollHeight;
  return bubble;
}

function initFeedbackSystem() {
  loadFeedbacks();

  const form = document.getElementById("feedbackForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const author = document.getElementById("fbAuthor").value.trim();
    const content = document.getElementById("fbContent").value.trim();

    if (!author || !content) return;

    try {
      await addDoc(collection(db, "feedbacks"), {
        author,
        content,
        createdAt: serverTimestamp()
      });

      document.getElementById("fbAuthor").value = "";
      document.getElementById("fbContent").value = "";
      alert("피드백이 성공적으로 등록되었습니다!");
      loadFeedbacks();
    } catch (error) {
      alert("피드백 저장에 실패했습니다.");
    }
  });
}

async function loadFeedbacks() {
  const listDiv = document.getElementById("feedbackList");

  try {
    const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      listDiv.innerHTML = "<p class='empty-state'>등록된 피드백이 없습니다.</p>";
      return;
    }

    let html = "";
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const dateStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : "방금 전";

      html += `
        <div class="feedback-item">
          <div class="fb-meta">
            <span class="fb-author">${escapeHtml(data.author)}</span>
            <span class="fb-date">${dateStr}</span>
          </div>
          <div class="fb-text">${escapeHtml(data.content)}</div>
        </div>
      `;
    });

    listDiv.innerHTML = html;
  } catch (error) {
    listDiv.innerHTML = "<p class='empty-state'>목록 로드 중 오류가 발생했습니다.</p>";
  }
}

function switchTab(tabName) {
  const tabs = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(t => t.classList.remove("active"));
  contents.forEach(c => c.classList.remove("active"));

  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
  document.getElementById(`tab-${tabName}`).classList.add("active");
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}