module.exports = async function (req, res) {
  // CORS 설정 (로컬 테스트용)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // OPTIONS 요청 (Preflight) 시 바로 응답
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 처리
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  // 시스템 프롬프트: AI 감정일기 컨셉에 맞춤
  const systemPrompt = "너는 친절하고 공감 능력이 뛰어난 심리 상담가이자 다이어리 메이트야. 사용자가 오늘 하루에 대한 감정이나 일기를 입력하면, 따뜻하게 위로해주고, 공감하며, 긍정적인 생각으로 마무리할 수 있도록 2~3문장 정도로 다정하게 답변해줘.";

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    // 단순화된 프롬프트 구조 사용 - Gemini v1beta 규칙
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `[System Instruction: ${systemPrompt}]\n\nUser Profile/Diary: ${message}` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return res.status(response.status).json({ error: 'Google API Error', details: data });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "답변을 생성할 수 없습니다.";
    
    return res.status(200).json({ reply: aiText });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
