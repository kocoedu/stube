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
유튜브의 수능/공부법 채널(예: 연고티비 등) 데이터를 기반으로 수치화된 신뢰도 높은 리포트를 작성하세요.

[수험생 정보]
- 학년: ${grade || '고등학생'}
- 성적 수준: ${level || '전체'}
- 수험생 고민/키워드: ${query}

다음 항목을 명확히 구분하여 답변해 주세요:
1. 데이터 기반 검증 수치 (예: 연고대 선배 12명 중 9명이 추천한 교재)
2. 수준별 추천 문제지 및 N제
3. 수준별 인강 강사 및 대표 커리큘럼
4. 과목별 핵심 학습법 및 타임스탬프 기반 노하우
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return res.status(200).json({ result: data.candidates[0].content.parts[0].text });
    } else {
      return res.status(500).json({ error: 'Gemini 응답 생성 실패', details: data });
    }
  } catch (error) {
    return res.status(500).json({ error: '서버 내부 오류', details: error.message });
  }
}