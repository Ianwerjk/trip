export default function handler(request, response) {
  // 從 Vercel 的環境變數中，安全地讀取您儲存的設定
  // 我們假設 FIREBASE_CONFIG 是 JSON 字串，需要解析
  const firebaseConfigString = process.env.VITE_FIREBASE_CONFIG;
  const googleMapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;

  // 檢查變數是否存在
  if (!firebaseConfigString || !googleMapsApiKey) {
    return response.status(500).json({ 
      error: '伺服器環境變數未正確設定。' 
    });
  }

  try {
    // 解析 Firebase 設定字串
    const firebaseConfig = JSON.parse(firebaseConfigString);

    // 將設定回傳給前端
    return response.status(200).json({
      firebaseConfig: firebaseConfig,
      googleMapsApiKey: googleMapsApiKey,
    });
    
  } catch (error) {
    console.error("解析 Firebase 設定時出錯:", error);
    return response.status(500).json({ 
      error: '伺服器上的 Firebase 設定格式無效。'
    });
  }
}

