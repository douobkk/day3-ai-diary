module.exports = async function (req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY가 서버에 설정되지 않았습니다.' });

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: '메시지가 없습니다.' });

  const systemPrompt = "너는 심리상담가야. 사용자가 작성한 일기내용을 읽고, 따뜻한 응원의 메시지를 2~3문장으로 작성해줘. 답변 형식은 반드시 '감정:[요약된감정]\\n\\n[응원메시지]' 와 같이 줄바꿈 해서 보여줘.";

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: `[System Instruction: ${systemPrompt}]\n\n사용자 일기: ${message}` }]
        }],
        generationConfig: { temperature: 0.7 }
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: 'Gemini API 오류', details: data });

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "답변을 생성할 수 없습니다.";
    return res.status(200).json({ reply: aiText });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: '서버 내부 오류' });
  }
};
