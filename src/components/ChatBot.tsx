export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callLLM(messages: ChatMessage[]) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const modelName = 'gemini-1.5-flash'; // 안정성 높은 모델
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  
  // Gemini API 포맷에 맞춰 메시지 변환
  const contents = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
  }));

  const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
  });

  const data = await response.json();
  return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  };
}