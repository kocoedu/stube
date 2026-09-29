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
    return res.status(500).json({ error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. Vercel Settings에서 확인해 주세요.' });
  }

  const { query, grade, level } = req.query;

  if (!query) {
    return res.status(400).json({ error: '분석 요청 키워드가 누락되었습니다.' });
  }

  const prompt = `
당신은 수험생 맞춤형 학습 컨설팅 앱 '스튜브(STube)'의 전문 AI 컨설턴트입니다.
유튜브의 수능/공부법 채널(연고티비 등) 데이터를 기반으로 수치화된 신뢰도 높은 리포트를 작성하세요.

[수험생 정보]
- 학년: ${grade || '고등학생'}
- 성적 수준: ${level || '전체'}
- 수험생 고민/키워드: ${query}

다음 항목을 명확히 구분하여 작성해 주세요:
1. 데이터 기반 검증 수치 (예: 연고대 선배 12명 중 9명이 추천한 교재)
2. 수준별 추천 문제지 및 N제
3. 수준별 인강 강사 및 대표 커리큘럼
4. 과목별 핵심 학습법 및 실전 전략
`;

  // 503 과부하 발생 시 순차적으로 자동 전환할 대체 모델 목록
  const candidateModels = [
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash"
  ];

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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

      // 503 과부하 또는 일시적 오류 시 다음 모델로 전환
      if (data.error) {
        lastError = `[${model}] ${data.error.message} (${data.error.code})`;
        if (data.error.code === 503 || data.error.code === 429 || data.error.code === 404) {
          continue;
        }
        return res.status(500).json({ error: `Gemini API 에러 [${data.error.code}]: ${data.error.message}` });
      }

      // 텍스트 추출 로직
      const candidate = data.candidates && data.candidates[0];
      if (candidate && candidate.content && candidate.content.parts) {
        const nonThoughtTexts = candidate.content.parts
          .filter(part => part.text && !part.thought)
          .map(part => part.text);

        if (nonThoughtTexts.length > 0 && nonThoughtTexts.join('').trim().length > 0) {
          return res.status(200).json({ result: nonThoughtTexts.join('\n') });
        }

        const allTexts = candidate.content.parts
          .map(part => part.text || '')
          .filter(t => t.trim().length > 0);

        if (allTexts.length > 0) {
          return res.status(200).json({ result: allTexts.join('\n') });
        }
      }
    } catch (err) {
      lastError = err.message;
      continue;
    }
  }

  // 모든 후보 모델이 실패한 경우
  return res.status(503).json({
    error: `현재 AI 서비스 접속량이 많아 일시적으로 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요. (${lastError})`
  });
}