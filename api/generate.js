export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const apiKey = process.env.NEIS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'NEIS_API_KEY 환경 변수가 설정되지 않았습니다.' });
  }

  const { pIndex = 1, pSize = 10, ...queryParams } = req.query;

  try {
    // 예시: 학교기본정보 엔드포인트 호출 (필요에 따라 엔드포인트 변경 가능)
    const searchParams = new URLSearchParams({
      KEY: apiKey,
      Type: 'json',
      pIndex,
      pSize,
      ...queryParams
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`);
    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'NEIS API 호출 중 오류가 발생했습니다.', details: error.message });
  }
}