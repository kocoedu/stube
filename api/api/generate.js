export default async function handler(req, res) {
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

  const { query, grade, level } = req.query;

  if (!query) {
    return res.status(400).json({ error: '분석 요청 키워드가 누락되었습니다.' });
  }

  try {
    const prompt = `
당신은 수험생 맞춤형 학습 컨설팅 앱 '스튜브(STube)'의 전문 AI 컨설턴트입니다.
유튜브의 수능/공부법 채널(연고티비 등) 데이터를 기반으로 수치화된 신뢰도 높은 리포트를 작성하세요.

[수험생 정보]
- 학년: ${grade || '고등학생'}
- 성적 수준: ${level || '전체'}
- 수험생 고민/키워드: ${query}

다음 항목을 명확히 구분하여 가독성 있게 작성해 주세요:
1. 데이터 기반 검증 수치 (예: 연고대 선배 12명 중 9명이 추천한 교재)
2. 수준별 추천 문제지 및 N제
3. 수준별 인강 강사 및 대표 커리큘럼
4. 과목별 핵심 학습법 및 실전 전략
`;

    // 제공해주신 모델 목록 중 가장 안정적인 gemini-2.5-flash 호출
    const targetModel = "gemini-2.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    const data = await response.json();

    // API 에러 응답이 직접 반환된 경우 (인증 오류, 할당량 초과 등)
    if (data.error) {
      return res.status(500).json({
        error: `Gemini API 에러 (${data.error.code}): ${data.error.message}`,
        details: data.error
      });
    }

    // 응답 텍스트 추출 (thinking 파트 분리 및 안전한 텍스트 파싱)
    const candidate = data.candidates && data.candidates[0];
    if (candidate && candidate.content && candidate.content.parts) {
      // thinking 파트 제외하고 실제 text 파트만 결합
      const textParts = candidate.content.parts
        .filter(part => part.text && !part.thought)
        .map(part => part.text);

      const resultText = textParts.length > 0 
        ? textParts.join("\n") 
        : candidate.content.parts.map(p => p.text || "").join("\n");

      if (resultText.trim().length > 0) {
        return res.status(200).json({ result: resultText });
      }
    }

    return res.status(500).json({ 
      error: 'Gemini 응답 생성 실패: 응답 본문에서 텍스트를 추출할 수 없습니다.', 
      details: data 
    });

  } catch (error) {
    return res.status(500).json({ 
      error: '서버 내부 오류가 발생했습니다.', 
      details: error.message 
    });
  }
}