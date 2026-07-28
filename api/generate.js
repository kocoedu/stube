export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' });
  }

  const { query, subject, grade } = req.query;

  if (!query) {
    return res.status(400).json({ error: '분석할 키워드나 질문을 입력해주세요.' });
  }

  try {
    // 프롬프트 구성 (스튜브 분석 전용)
    const prompt = `
당신은 수험생을 위한 AI 학습 컨설턴트 '스튜브(STube)'입니다.
수험생의 요청사항을 바탕으로 과목별 맞춤 문제지 추천, 수준별 인강 선생님 추천, 과목별 학습 방법을 정리해 주세요.

[수험생 정보]
- 학년/수준: ${grade || '고등학생'}
- 과목: ${subject || '전과목'}
- 고민/검색 키워드: ${query}

다음 형식으로 가독성 좋게 답변해 주세요:
1. 📚 추천 문제지 (기초/심화 구분)
2. 👨‍🏫 추천 인강 강사 및 커리큘럼
3. 💡 과목별 맞춤 학습법 전략
`;

    // Gemini API 호출 (gemini-2.5-flash 모델)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const resultText = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ result: resultText });
    } else {
      return res.status(500).json({ error: 'Gemini API 응답 분석 실패', details: data });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Gemini API 호출 중 오류 발생', details: error.message });
  }
}