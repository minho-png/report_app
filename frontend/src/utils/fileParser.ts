import axios from 'axios';
import { generateInsight } from './llm';

export const processExcelFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    // 1. Python 백엔드 호출 (가변 컬럼/E.섹션 추출 로직 실행)
    const response = await axios.post('http://localhost:8000/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    const extractedData = response.data;
    if (extractedData.error) throw new Error(extractedData.error);

    // 2. 추출된 데이터를 Gemini API에 전달
    const insight = await generateInsight(JSON.stringify(extractedData));

    // 3. 최종 보고서 객체 생성
    const finalReport = {
      id: Date.now().toString(),
      fileName: file.name,
      date: new Date().toLocaleDateString(),
      rawSummary: extractedData.rawSummary,
      mediaMixData: extractedData.mediaMixData,
      insight: insight,
    };

    // 4. 로컬 스토리지 저장 (보고서 템플릿 엔진에서 사용)
    const existingReportsStr = localStorage.getItem('reports');
    const existingReports = existingReportsStr ? JSON.parse(existingReportsStr) : [];
    localStorage.setItem('reports', JSON.stringify([finalReport, ...existingReports]));

    return finalReport;
  } catch (error) {
    console.error("전체 프로세스 에러:", error);
    throw error;
  }
};