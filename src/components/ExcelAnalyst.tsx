import React, { useState } from 'react';
import { analyzeWithPandas } from '../utils/api'; //
import { callLLM } from '../utils/llm'; //
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ExcelAnalyst: React.FC = () => {
  // 에러를 해결하기 위한 상태(State) 선언
  const [excelData, setExcelData] = useState<any>(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [phase1Result, setPhase1Result] = useState<any>(null);

  const runPhase1 = async () => {
    if (!excelData) return;
    setIsLoading(true);
    setStatusMsg("Python(Pandas) 백엔드에서 데이터 정밀 분석 중...");

    try {
      // 1. LLM에게 '컬럼 매핑' 요청
      const mappingPrompt = `
        다음 데이터의 헤더를 보고 표준 컬럼명으로 매핑해줘 (JSON만 출력):
        Headers: ${JSON.stringify(excelData.raw?.headers || [])}
        Required Keys: impression_col, click_col, cost_col, conversion_col, campaign_col
      `;
      const mapRes = await callLLM([{ role: 'user', content: mappingPrompt }]);
      
      // JSON 파싱 에러 방지 처리
      const cleanJson = mapRes.content.replace(/```json|```/g, '').trim();
      const mapping = JSON.parse(cleanJson);

      // 2. 로컬 Python(Pandas) 서버에 분석 요청
      const pandasResult = await analyzeWithPandas(excelData.raw.rows, mapping);

      // 3. 결과 병합 및 저장
      setPhase1Result({
        ...pandasResult,
        t_max_date: "Python 분석 결과 참조", 
        analysis_type: "Local Pandas Calculation"
      });
      setStatusMsg("분석이 성공적으로 완료되었습니다.");

    } catch (e) {
      console.error(e);
      setStatusMsg("분석 실패: 서버 연결 상태를 확인하세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h3 className="text-lg font-bold mb-4">데이터 정밀 분석</h3>
      <button 
        onClick={runPhase1}
        disabled={isLoading || !excelData}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? <Loader2 className="animate-spin" size={18} /> : "분석 시작"}
      </button>
      
      {statusMsg && (
        <p className="mt-2 text-sm flex items-center gap-1">
          {statusMsg.includes("실패") ? <AlertCircle size={14} className="text-red-500" /> : <CheckCircle size={14} className="text-green-500" />}
          {statusMsg}
        </p>
      )}
    </div>
  );
};

export default ExcelAnalyst;