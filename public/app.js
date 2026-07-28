// app.js 내 기존 fetchNeisData 함수 대신 아래 함수로 대체
async function fetchGeminiAnalysis() {
  const queryInput = document.getElementById("schoolInput").value.trim(); // 키워드/고민 입력창
  const resultDiv = document.getElementById("curriculumResult");

  if (!queryInput) {
    alert("분석할 키워드나 학습 고민을 입력해주세요.");
    return;
  }

  resultDiv.innerHTML = "🤖 Gemini AI가 유튜브 데이터 및 커리큘럼을 분석 중입니다...";

  try {
    const response = await fetch(`/api/generate?query=${encodeURIComponent(queryInput)}&grade=고3&subject=전과목`);
    const data = await response.json();

    console.log("Gemini API Response:", data);

    if (data.result) {
      // 줄바꿈 문자를 HTML <br>로 변환하여 표시
      const formattedResult = data.result.replace(/\n/g, "<br>");
      resultDiv.innerHTML = `
        <div style="line-height: 1.8;">
          ${formattedResult}
        </div>
      `;
    } else if (data.error) {
      resultDiv.innerHTML = `<p style="color:red;">오류: ${data.error}</p>`;
    } else {
      resultDiv.innerHTML = "<p>분석 결과를 가져오지 못했습니다.</p>";
    }
  } catch (error) {
    console.error("API 호출 오류:", error);
    resultDiv.innerHTML = "<p>분석 요청 중 오류가 발생했습니다.</p>";
  }
}

// 이벤트 리스너 연결
document.getElementById("searchBtn").addEventListener("click", fetchGeminiAnalysis);