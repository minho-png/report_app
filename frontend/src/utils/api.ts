/**
 * Python Backend (FastAPI) 연동 모듈
 */
export async function analyzeWithPandas(data: any[], mapping: any) {
    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // main.py의 AnalysisRequest 모델에 맞춤
        body: JSON.stringify({
          data: data,
          mapping: mapping
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error("Pandas API 호출 실패:", error);
      throw error;
    }
  }