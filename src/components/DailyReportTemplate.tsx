import React, { useRef } from 'react';
import { FileDown, Calendar, TrendingUp } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface Props {
  data: any; // Backend에서 넘어온 분석 데이터
  campaignName: string;
  insightText: string; // Gemini가 생성한 인사이트
}

const DailyReportTemplate: React.FC<Props> = ({ data, campaignName, insightText }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const saveAsPDF = () => {
    const element = reportRef.current;
    if (!element) return;

    const options = {
      margin: 0,
      filename: `${campaignName}_보고서_${data.date}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    html2pdf().set(options).from(element).save();
  };

  const format = (n: number) => new Intl.NumberFormat('ko-KR').format(n);

  return (
    <div className="bg-slate-100 py-10 min-h-screen">
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-end">
        <button onClick={saveAsPDF} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-xl active:scale-95">
          <FileDown size={18} /> PDF 즉시 다운로드
        </button>
      </div>

      <div ref={reportRef} className="report-page bg-white w-[210mm] min-h-[297mm] mx-auto p-[15mm] shadow-2xl box-border text-slate-900">
        {/* 헤더 */}
        <header className="border-b-4 border-blue-600 pb-6 mb-8 flex justify-between items-end">
          <div className="space-y-1">
            <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-sm font-black uppercase tracking-widest mb-1 inline-block">Daily Analysis Report</span>
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">광고 성과 일일 보고서</h1>
            <div className="flex items-center text-xs font-bold text-gray-500 mt-2 space-x-3">
              <span className="flex items-center"><Calendar size={14} className="mr-1.5 text-blue-600" /> {data.date} (기준일)</span>
              <span className="text-gray-300">/</span>
              <span className="text-gray-400">비교일: {data.prevDate}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-blue-600 font-black text-xl italic uppercase tracking-tighter">{campaignName}</div>
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-2">Nasmedia Performance Team</p>
          </div>
        </header>

        {/* 대시보드 요약 */}
        <section className="mb-10">
          <div className="flex items-center mb-4"><div className="bg-blue-600 w-1.5 h-4 mr-2"></div><h2 className="text-xs font-black uppercase tracking-widest">Performance Summary</h2></div>
          <div className="grid grid-cols-3 gap-4">
            {['impressions', 'clicks', 'spend'].map((key) => {
              const cur = data.overall[key].today;
              const prev = data.overall[key].prev;
              const delta = (((cur - prev) / prev) * 100).toFixed(1);
              return (
                <div key={key} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col justify-between h-28">
                  <div className="text-gray-400 text-[8px] font-black uppercase">{key}</div>
                  <div className="text-xl font-black tracking-tighter">{key === 'spend' ? '₩' : ''}{format(cur)}</div>
                  <div className="flex justify-between items-center border-t pt-2 mt-1">
                    <span className="text-[8px] text-gray-400 font-bold uppercase">vs Prev Day</span>
                    <span className={`text-[9px] font-bold ${Number(delta) >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{delta}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Gemini 인사이트 섹션 */}
        <section className="mb-10">
          <div className="flex items-center mb-3"><div className="bg-blue-600 w-1.5 h-3.5 mr-2"></div><h2 className="text-[10px] font-black uppercase tracking-widest">Daily Insights by Gemini</h2></div>
          <div className="bg-gray-900 text-gray-100 rounded-xl p-6 border-l-8 border-blue-600 shadow-xl">
             <div className="text-[11px] font-medium leading-relaxed whitespace-pre-wrap italic">{insightText}</div>
          </div>
        </section>

        {/* 매체별/소재별 실적 테이블 (동적 생성) */}
        {[
          { title: "Media Performance", list: data.mediaComparison },
          { title: "Creative Performance", list: data.creativeComparison }
        ].map((section, sIdx) => section.list && (
          <section key={sIdx} className="mb-10">
            <div className="flex items-center mb-4"><div className="bg-blue-600 w-1.5 h-4 mr-2"></div><h2 className="text-xs font-black uppercase tracking-widest">{section.title}</h2></div>
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-gray-900 text-white">
                  <tr className="font-black uppercase tracking-tighter">
                    <th className="py-3 px-4 border-r border-gray-700">Category</th>
                    <th className="py-3 px-4 text-right border-r border-gray-700">{data.prevDate}</th>
                    <th className="py-3 px-4 text-right border-r border-gray-700">{data.date}</th>
                    <th className="py-3 px-4 text-right">Delta (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {section.list.map((item: any, idx: number) => (
                    <tr key={idx} className="bg-white">
                      <td className="py-3 px-4 font-bold bg-gray-50/50 border-r border-gray-100">{item.name}</td>
                      <td className="py-3 px-4 text-right text-gray-400 font-mono border-r border-gray-100">{format(item.metrics.impressions.prev)}</td>
                      <td className="py-3 px-4 text-right font-black border-r border-gray-100">{format(item.metrics.impressions.today)}</td>
                      <td className={`py-3 px-4 text-right font-bold ${item.metrics.impressions.delta >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                        {item.metrics.impressions.delta}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <footer className="mt-auto pt-6 border-t border-gray-100 flex justify-between items-center text-[8px] text-gray-400 font-bold uppercase tracking-widest">
            <div>Auth: DMP-AUTO-REPORT-V1</div>
            <div className="text-gray-900 font-black italic">Nasmedia Performance Team</div>
        </footer>
      </div>
    </div>
  );
};

export default DailyReportTemplate;