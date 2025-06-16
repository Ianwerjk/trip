
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: '僅允許 POST 方法' });
  }

  const { text } = request.body;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geocodeApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!geminiApiKey || !geocodeApiKey || !text) {
    return response.status(500).json({ error: '伺服器設定不完整或缺少文字內容。' });
  }

  // 1. 請 Gemini 分析文字並回傳 JSON
  const prompt = `你是一個專業的旅遊行程分析師。請分析以下這段純文字的旅遊行程，並嚴格按照指定的 JSON 格式回傳結果。
  行程文字如下：
  ---
  ${text}
  ---
  JSON 格式範例：
  {
    "title": "我的東京之旅",
    "days": [
      {
        "day": 1,
        "locations": [
          { "time": "17:05", "title": "成田機場" },
          { "time": "晚上", "title": "池袋飯店" }
        ]
      },
      {
        "day": 2,
        "locations": [
          { "time": "10:45~13:00", "title": "吉卜力美術館" },
          { "time": "13:00~14:30", "title": "井之頭恩賜公園" }
        ]
      }
    ]
  }
  請確保 day 是數字，locations 是一個包含物件的陣列。`;
  
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" }
  };

  try {
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!geminiRes.ok) throw new Error('Gemini API 請求失敗');
    
    const geminiResult = await geminiRes.json();
    let structuredItinerary = JSON.parse(geminiResult.candidates[0].content.parts[0].text);

    // 2. 依序為每個地點加上經緯度
    for (const day of structuredItinerary.days) {
      if (day.locations) {
        for (const location of day.locations) {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location.title)}&key=${geocodeApiKey}&language=zh-TW`;
          const geocodeRes = await fetch(geocodeUrl);
          const geocodeResult = await geocodeRes.json();
          if (geocodeResult.status === 'OK') {
            location.lat = geocodeResult.results[0].geometry.location.lat;
            location.lng = geocodeResult.results[0].geometry.location.lng;
            location.id = Date.now().toString() + Math.random().toString(16).slice(2);
          }
          // 短暫延遲避免瞬間請求過多
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }
    
    return response.status(200).json(structuredItinerary);

  } catch (error) {
    console.error('Import Itinerary Error:', error);
    return response.status(500).json({ error: `匯入過程中發生錯誤: ${error.message}` });
  }
}


