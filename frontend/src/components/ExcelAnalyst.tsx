import React, { useState } from 'react';
import { analyzeWithPandas } from '../utils/api';
import { callLLM, generateInsight } from '../utils/llm';
import { Loader2, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import DailyReportTemplate from './DailyReportTemplate';
import { parseExcel } from '../utils/excel';

const ExcelAnalyst: React.FC = () => {
  const [excelData, setExcelData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [reportResult, setReportResult] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseExcel(file);
      setExcelData(data);
      setStatusMsg("파일이 준비되었습니다. 분석을 시작하세요.");
    } catch (err) {
      setStatusMsg("파일 파싱 실패");
    }
  };

  const runAnalysis = async () => {
    if (!excelData) return;
    setIsLoading(true);
    setStatusMsg("LLM이 복잡한 MediaMix 구조를 분석 중입니다...");

    try {
      // 1. LLM에게 컬럼 매핑 요청 (헤더와 샘플 데이터 3줄 제공)
      const mappingPrompt = `
        엑셀 정보를 보고 성과 분석을 위한 컬럼 매핑 정보를 JSON으로만 응답해줘.
        [RAW 헤더]: ${JSON.stringify(excelData.raw?.headers)}
        [MediaMix 헤더]: ${JSON.stringify(excelData.mediaMix?.headers)}
        [MediaMix 샘플 데이터]: ${JSON.stringify(excelData.mediaMix?.rows?.slice(0, 3))}

        반드시 아래 키를 가진 JSON 객체 하나만 출력해:
        {
          "raw_mapping": { "date_col": "...", "media_col": "...", "imp_col": "...", "cost_col": "..." },
          "mix_mapping": { "media_name_col": "...", "budget_col": "..." }
        }
      `;

      const mapRes = await callLLM([{ role: 'user', content: mappingPrompt }]);
      const mappings = JSON.parse(mapRes.content.replace(/```json|```/g, '').trim());

      // 2. 백엔드 호출 (DOD 및 진행률 계산)
      setStatusMsg("백엔드에서 정밀 성과 지표를 계산 중입니다...");
      const pandasResult = await analyzeWithPandas(
        excelData.raw.rows,
        excelData.mediaMix.rows,
        mappings
      );

      // 3. Gemini 인사이트 생성
      setStatusMsg("Gemini가 성과 인사이트를 작성 중입니다...");
      const insight = await generateInsight(JSON.stringify(pandasResult));

      setReportResult({ ...pandasResult, insight });
      setStatusMsg("분석이 성공적으로 완료되었습니다.");
    } catch (e) {
      console.error(e);
      setStatusMsg("분석 실패: 데이터 구조를 확인하세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="p-6 bg-white border-b flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 font-bold transition-all">
            <Upload size={18} /> 데이터 업로드
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx,.xls" />
          </label>
          <span className="text-sm text-slate-500 font-medium">{excelData?.fileName || "분석할 엑셀 파일을 선택하세요."}</span>
        </div>
        <button 
          onClick={runAnalysis}
          disabled={isLoading || !excelData}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 shadow-lg"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "보고서 생성"}
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {reportResult ? (
          <DailyReportTemplate data={reportResult} campaignName={excelData.fileName} insightText={reportResult.insight} />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-300">
            {statusMsg || "파일을 업로드하고 분석을 시작해주세요."}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelAnalyst;