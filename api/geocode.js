export default async function handler(request, response) {
  const { address } = request.query;
  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey || !address) {
    return response.status(400).json({ error: '缺少 API 金鑰或地址。' });
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=zh-TW`;

  try {
    const geocodeResponse = await fetch(url);
    const data = await geocodeResponse.json();

    if (data.status === 'OK') {
      response.status(200).json(data.results[0].geometry.location);
    } else {
      // 回傳更明確的錯誤，讓前端知道問題
      response.status(404).json({ error: '找不到地點', details: data.status });
    }
  } catch (error) {
    console.error("Geocode function error:", error);
    response.status(500).json({ error: '伺服器錯誤', details: error.message });
  }
}
