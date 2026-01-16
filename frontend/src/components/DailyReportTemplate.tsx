import React, { useRef } from 'react';
import { FileDown, Calendar, TrendingUp } from 'lucide-react'; // Target 제거
import html2pdf from 'html2pdf.js';

interface Props {
  data: any;
  campaignName: string;
  insightText: string;
}

const DailyReportTemplate: React.FC<Props> = ({ data, campaignName, insightText }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const saveAsPDF = () => {
    const element = reportRef.current;
    if (!element) return; // Ref null 체크 (에러 2345 해결)

    const options = {
      margin: 10,
      filename: `${campaignName}_보고서_${data.date}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 }, // 'jpeg' as const 추가 (에러 2345 해결)
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { 
        unit: 'mm' as const, 
        format: 'a4' as const, 
        orientation: 'portrait' as const 
      } // 리터럴 타입 지정 (에러 2345 해결)
    };
    
    html2pdf().set(options).from(element).save();
  };

  const format = (n: number) => new Intl.NumberFormat('ko-KR').format(n);

  return (
    <div className="h-full overflow-y-auto bg-slate-100 py-10 px-4">
      {/* ... 이하 리포트 레이아웃 동일 ... */}
      <div ref={reportRef} className="report-page bg-white w-[210mm] min-h-[297mm] mx-auto p-[20mm] shadow-2xl">
         {/* ... */}
      </div>
    </div>
  );
};

export default DailyReportTemplate;