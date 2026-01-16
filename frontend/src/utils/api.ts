/**
 * Python Backend (FastAPI) 연동 모듈
 * path: src/utils/api.ts
 */
export async function analyzeWithPandas(rawRows: any[], mixRows: any[], mappings: any) {
  try {
    const response = await fetch('http://localhost:8000/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // 백엔드 AnalysisRequest 모델의 키값과 일치시킵니다.
      body: JSON.stringify({
        raw_rows: rawRows,
        mix_rows: mixRows,
        mappings: mappings
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