
export default async function handler(request, response) {
  if (request.method !== 'POST') { return response.status(405).json({ error: '僅允許 POST 方法' }); }
  const { prompt } = request.body;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) { return response.status(500).json({ error: '管理員尚未設定 Gemini API 金鑰。' }); }
  const modelToUse = 'gemini-1.5-pro';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${geminiApiKey}`;
  const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
  try {
    const geminiResponse = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!geminiResponse.ok) { const errorBody = await geminiResponse.text(); console.error('Google API Error:', errorBody); return response.status(geminiResponse.status).json({ error: `Google API 請求失敗: ${geminiResponse.statusText}` }); }
    const result = await geminiResponse.json();
    const text = result.candidates[0].content.parts[0].text;
    return response.status(200).json({ text: text });
  } catch (error) { console.error('Handler Error:', error); return response.status(500).json({ error: '雲端函數執行時發生內部錯誤。' }); }
}
