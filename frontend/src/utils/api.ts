export async function analyzeWithPandas(rawRows: any[], mixRows: any[], mappings: any) {
  console.log("[API] 백엔드로 데이터 전송 시작...");
  console.log("[API] Payload Summary - Raw 행수:", rawRows.length, "Mappings:", mappings);

  try {
    const response = await fetch('http://localhost:8000/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raw_rows: rawRows,
        mix_rows: mixRows,
        mappings: mappings
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("[API] 백엔드 응답 에러:", err);
      throw new Error(err.detail || "Server Error");
    }

    const result = await response.json();
    console.log("[API] 백엔드 분석 결과 수신 성공:", result);
    return result;
  } catch (error) {
    console.error("[API] 통신 실패:", error);
    throw error;
  }
}