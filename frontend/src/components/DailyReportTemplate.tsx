import React, { useRef } from 'react';
import { FileDown, Calendar, TrendingUp, Award } from 'lucide-react';
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
    if (!element) return;

    const options = {
      margin: 10,
      filename: `${campaignName}_광고리포트_${data.date}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    html2pdf().set(options).from(element).save();
  };

  const format = (n: number) => new Intl.NumberFormat('ko-KR').format(n);

  return (
    <div className="bg-slate-50 py-10 min-h-screen overflow-y-auto">
      {/* 리포트 조작부 */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-end">
        <button 
          onClick={saveAsPDF} 
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-2xl hover:bg-blue-700 active:scale-95 transition-all"
        >
          <FileDown size={20} /> PDF 리포트 다운로드
        </button>
      </div>

      {/* 리포트 본문 (A4 규격) */}
      <div ref={reportRef} className="report-page bg-white w-[210mm] min-h-[297mm] mx-auto p-[20mm] shadow-2xl box-border text-slate-900 flex flex-col">
        {/* 헤더 */}
        <header className="border-b-[5px] border-blue-600 pb-8 mb-10 flex justify-between items-end">
          <div>
            <div className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter mb-3 inline-block">Daily Performance Analysis</div>
            <h1 className="text-4xl font-black tracking-tighter leading-none text-slate-800">광고 성과 분석 보고서</h1>
            <div className="flex items-center text-sm font-bold text-slate-400 mt-4 space-x-4">
              <span className="flex items-center text-slate-600"><Calendar size={16} className="mr-2 text-blue-600" /> {data.date} (기준일)</span>
              <span className="opacity-30">/</span>
              <span>대조군: {data.prevDate}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-blue-600 font-black text-2xl italic tracking-tight">{campaignName}</div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">DMP Automated Report System</p>
          </div>
        </header>

        {/* 1. 요약 지표 카드 */}
        <section className="mb-12">
          <div className="flex items-center mb-5"><div className="bg-blue-600 w-2 h-5 mr-3"></div><h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Core KPI Summary</h2></div>
          <div className="grid grid-cols-3 gap-6">
            {['impressions', 'clicks', 'spend'].map((key) => {
              const cur = data.overall[key].today;
              const prev = data.overall[key].prev;
              const delta = prev > 0 ? (((cur - prev) / prev) * 100).toFixed(1) : "0.0";
              return (
                <div key={key} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-between h-32 shadow-sm">
                  <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider">{key}</div>
                  <div className="text-2xl font-black tracking-tighter">{key === 'spend' ? '₩' : ''}{format(cur)}</div>
                  <div className="flex justify-between items-center border-t border-slate-200/60 pt-3 mt-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">vs Prev Day</span>
                    <span className={`text-xs font-black ${Number(delta) >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                      {Number(delta) >= 0 ? '▲' : '▼'} {Math.abs(Number(delta))}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. AI 인사이트 섹션 */}
        <section className="mb-12">
          <div className="flex items-center mb-4 text-slate-800">
            <Award size={20} className="mr-2 text-blue-600" />
            <h2 className="text-sm font-black uppercase tracking-widest">AI Intelligence Insights</h2>
          </div>
          <div className="bg-slate-900 text-white rounded-3xl p-8 border-l-[8px] border-blue-600 shadow-xl">
             <div className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap italic opacity-90">{insightText}</div>
          </div>
        </section>

        {/* 3. 매체별 성과 상세 테이블 */}
        <section>
          <div className="flex items-center mb-5"><div className="bg-blue-600 w-2 h-5 mr-3"></div><h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Media Performance</h2></div>
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-800 text-white">
                <tr className="font-bold uppercase">
                  <th className="py-4 px-6">Media Platform</th>
                  <th className="py-4 px-6 text-right">Prev ({data.prevDate})</th>
                  <th className="py-4 px-6 text-right font-black">Today ({data.date})</th>
                  <th className="py-4 px-6 text-right">Delta (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.mediaComparison.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-700 bg-slate-50/30">{item.name}</td>
                    <td className="py-4 px-6 text-right text-slate-400 font-mono">{format(item.metrics.impressions.prev)}</td>
                    <td className="py-4 px-6 text-right font-black">{format(item.metrics.impressions.today)}</td>
                    <td className={`py-4 px-6 text-right font-black ${item.metrics.impressions.delta >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                      {item.metrics.impressions.delta > 0 ? '+' : ''}{item.metrics.impressions.delta}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <div>Verification: DMP-GEN-V2.5-FLASH</div>
            <div className="text-slate-800 font-black italic">Performance Marketing Team</div>
        </footer>
      </div>
    </div>
  );
};

export default DailyReportTemplate;