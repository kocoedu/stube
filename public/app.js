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

// ① 제공해주신 Firebase 설정값 반영
const firebaseConfig = {
  apiKey: "AIzaSyBaA-3e8eRcmaAyNTR35NqS43v7zlYyb1c",
  authDomain: "app-feedback-b36c4.firebaseapp.com",
  projectId: "app-feedback-b36c4",
  storageBucket: "app-feedback-b36c4.firebasestorage.app",
  messagingSenderId: "793262622057",
  appId: "1:793262622057:web:b665df4af083dd9c9869f8"
};

// Firebase 및 Firestore 초기화 (서비스 계정 키 미사용)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  loadFeedbacks();

  // 피드백 등록 이벤트
  const feedbackForm = document.getElementById("feedbackForm");
  feedbackForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const author = document.getElementById("authorInput").value.trim();
    const content = document.getElementById("contentInput").value.trim();

    if (!author || !content) return;

    try {
      // Firestore에 데이터 저장 (최신순 정렬을 위한 timestamp 포함)
      await addDoc(collection(db, "feedbacks"), {
        author,
        content,
        createdAt: serverTimestamp()
      });

      document.getElementById("authorInput").value = "";
      document.getElementById("contentInput").value = "";
      alert("등록되었습니다!");
      
      // 목록 새로고침
      loadFeedbacks();
    } catch (error) {
      console.error("Firestore 저장 오류:", error);
      alert("글 등록 중 오류가 발생했습니다.");
    }
  });

  // NEIS API 호출 버튼 이벤트
  const searchBtn = document.getElementById("searchBtn");
  searchBtn.addEventListener("click", fetchNeisData);
});

// ② & ⑤ Firestore에서 글 최신순으로 불러와 목록에 표시
async function loadFeedbacks() {
  const feedbackList = document.getElementById("feedbackList");
  
  try {
    const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      feedbackList.innerHTML = "<p>등록된 평가나 요청사항이 없습니다.</p>";
      return;
    }

    let html = "";
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const dateStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : "방금 전";
      
      html += `
        <div class="feedback-card">
          <div class="feedback-header">
            <strong>${escapeHtml(data.author)}</strong>
            <span class="date">${dateStr}</span>
          </div>
          <div class="feedback-body">
            ${escapeHtml(data.content)}
          </div>
        </div>
      `;
    });

    feedbackList.innerHTML = html;
  } catch (error) {
    console.error("Firestore 로드 오류:", error);
    feedbackList.innerHTML = "<p>목록을 불러오는 중 오류가 발생했습니다.</p>";
  }
}

// NEIS API (서버리스 함수) 호출 함수
async function fetchNeisData() {
  const schoolName = document.getElementById("schoolInput").value.trim();
  const resultDiv = document.getElementById("curriculumResult");

  if (!schoolName) {
    alert("학교명을 입력해주세요.");
    return;
  }

  resultDiv.innerHTML = "데이터를 불러오는 중...";

  try {
    const response = await fetch(`/api/generate?SCHUL_NM=${encodeURIComponent(schoolName)}`);
    const data = await response.json();

    if (data.schoolInfo) {
      const row = data.schoolInfo[1].row[0];
      resultDiv.innerHTML = `
        <p><strong>학교명:</strong> ${row.SCHUL_NM}</p>
        <p><strong>소재지:</strong> ${row.ORG_RDNMA}</p>
        <p class="info-note">✨ 10분 맞춤 커리큘럼이 준비되었습니다!</p>
      `;
    } else {
      resultDiv.innerHTML = "<p>검색 결과가 없거나 API 응답 형식이 일치하지 않습니다.</p>";
    }
  } catch (error) {
    console.error("API 호출 오류:", error);
    resultDiv.innerHTML = "<p>데이터 조회 실패.</p>";
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}