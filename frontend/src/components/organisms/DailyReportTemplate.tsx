'use client';

import React, { useRef } from 'react';
import { FileDown, Calendar, BarChart3, Database } from 'lucide-react'; // Added Database icon
import dynamic from 'next/dynamic';
import { AnalysisResponse, MediaComparison } from '../../types/report';
import ReportLayout from '../templates/ReportLayout';
import PerformanceGrid from './PerformanceGrid';
import MediaComparisonTable from './MediaComparisonTable';
import AIReportCard from './AIReportCard';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import { downloadExcel } from '../../utils/excel'; // Import download utility

// Recharts doesn't support SSR well
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });

interface Props {
    data: AnalysisResponse;
    campaignName: string;
    insightText: string;
    brandColor?: string;
    rawExcelData?: any; // Added prop
    onUpdate?: (updatedData: AnalysisResponse) => void; // Added prop
}

const DailyReportTemplate: React.FC<Props> = ({ data, campaignName, insightText, brandColor, rawExcelData, onUpdate }) => {
    const reportRef = useRef<HTMLDivElement>(null);

    const sanitizeFilename = (name: string) => {
        return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
    };

    const handleDownloadRaw = () => {
        // Use originalRaw if available, otherwise fallback to raw
        const dataToDownload = rawExcelData?.originalRaw?.rows || rawExcelData?.raw?.rows;

        if (!dataToDownload) {
            alert("Raw data is not available for this report.");
            return;
        }
        try {
            const fileName = sanitizeFilename(`${campaignName}_RawData_${data.date}`);
            downloadExcel(dataToDownload, fileName, "Raw Data");
        } catch (e) {
            console.error("Download failed", e);
            alert("다운로드 중 오류가 발생했습니다.");
        }
    };

    const handleInsightUpdate = (newInsight: string) => {
        if (!onUpdate) return;

        // Update either insight or insight_summary depending on what's being displayed/edited
        // AIReportCard displays 'insight_summary' preferentially if it exists.
        // But the props name it 'insight' (which is the full text) and 'insight_summary' (the short one).
        // The AIReportCard editing logic edits the visible text. 
        // If 'insight_summary' is present, that's what is being edited.

        const updatedData = { ...data };
        if (data.insight_summary) {
            updatedData.insight_summary = newInsight;
        } else {
            updatedData.insight = newInsight;
        }

        onUpdate(updatedData);
    };

    const saveAsPDF = async () => {
        if (!reportRef.current) return;
        try {
            const html2pdfModule = await import('html2pdf.js');
            const html2pdf = html2pdfModule.default || html2pdfModule;

            const element = reportRef.current;
            const fileName = sanitizeFilename(`${campaignName}_Report_${data.date}.pdf`);

            const opt: any = {
                margin: [10, 10, 10, 10],
                filename: fileName,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: {
                    scale: 3, // Higher scale for better clarity
                    useCORS: true,
                    logging: false,
                    letterRendering: true,
                    allowTaint: true,
                    scrollY: 0,
                    scrollX: 0,
                    // Remove extra aggressive cleaning that breaks layout
                    onclone: (clonedDoc: Document) => {
                        const editables = clonedDoc.querySelectorAll('[contenteditable]');
                        editables.forEach(el => el.removeAttribute('contenteditable'));

                        // Add styles specific for PDF capture
                        const style = clonedDoc.createElement('style');
                        style.innerHTML = `
                            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            .report-page { height: auto !important; min-height: auto !important; }
                            /* Ensure white backgrounds are white */
                            .bg-white { background-color: #ffffff !important; }
                         `;
                        clonedDoc.head.appendChild(style);
                    }
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait'
                },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            // @ts-ignore
            await html2pdf().set(opt).from(element).save();
            console.log("PDF export completed successfully");
        } catch (error) {
            console.error("Failed to export PDF:", error);
            alert("PDF 내보내기 중 오류가 발생했습니다. 브라우저 콘솔을 확인해 주세요.");
        }
    };

    const saveAsHTML = () => {
        if (!reportRef.current) return;
        try {
            // Clone the report element to modify it for export without touching the DOM
            const clone = reportRef.current.cloneNode(true) as HTMLElement;

            // Remove contentEditable attributes
            const editables = clone.querySelectorAll('[contenteditable]');
            editables.forEach(el => el.removeAttribute('contenteditable'));

            const content = clone.innerHTML;

            const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                .map(el => {
                    try {
                        return el.outerHTML;
                    } catch (e) {
                        return '';
                    }
                })
                .join('\n');

            const fileName = sanitizeFilename(`${campaignName}_Report_${data.date}.html`);
            const currentBrandColor = brandColor || data.brandColor || '#4f46e5';

            // Serialize raw data safely - Use Original Raw if available
            const rowsToSerialize = rawExcelData?.originalRaw?.rows || rawExcelData?.raw?.rows || [];
            const rawDataScript = rawExcelData ? `
                <script id="raw-data-payload" type="application/json">
                    ${JSON.stringify(rowsToSerialize)}
                </script>
                <script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>
                <script>
                    function downloadRawData() {
                        try {
                            const rawScript = document.getElementById('raw-data-payload');
                            if (!rawScript) { alert('No raw data found.'); return; }
                            const data = JSON.parse(rawScript.textContent);
                            
                            const ws = XLSX.utils.json_to_sheet(data);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "Raw Data");
                            XLSX.writeFile(wb, "${campaignName}_RawData.xlsx");
                        } catch(e) {
                            console.error(e);
                            alert('Download failed: ' + e.message);
                        }
                    }
                    
                    // Add download button if missing (or replace existing handler)
                    // We can just rely on the existing button structure if we preserve ids, 
                    // but React handlers are gone. We need to attach an onclick to the button with class 'raw-download-btn'
                    document.addEventListener('DOMContentLoaded', () => {
                        const btn = document.querySelector('.raw-download-btn');
                        if(btn) {
                            btn.onclick = downloadRawData;
                            btn.style.display = 'flex'; // Ensure it's visible
                        }
                    });
                </script>
            ` : '';

            const htmlTemplate = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${campaignName} - Daily Report</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/recharts@2.5.0/dist/Recharts.js"></script>
    ${styles}
    <style>
        :root { --brand-color: ${currentBrandColor}; }
        body { margin: 0; padding: 20px; background-color: #f8fafc; font-family: 'Noto Sans KR', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .heading-outfit { font-family: 'Outfit', 'Noto Sans KR', sans-serif; }
        .report-wrapper { max-width: 1000px; margin: 0 auto; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border-radius: 24px; padding: 40px; }
    </style>
</head>
<body>
    <div class="report-wrapper">
        ${content}
    </div>
    ${rawDataScript}
</body>
</html>`;

            const blob = new Blob([htmlTemplate], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export HTML:", error);
            alert("HTML 다운로드 중 오류가 발생했습니다.");
        }
    };

    const mediaChartData = data.mediaComparison?.map((m: MediaComparison) => ({
        name: m.name,
        today: m.metrics.impressions.today,
        prev: m.metrics.impressions.prev
    })) || [];

    const getChartHeight = (dataLength: number) => Math.max(200, dataLength * 40);
    const mediaChartHeight = getChartHeight(mediaChartData.length);

    return (
        <ReportLayout brandColor={brandColor || data.brandColor}>
            <div className="max-w-[1200px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20" style={{ backgroundColor: 'var(--brand-color)' }}>
                        <BarChart3 size={20} />
                    </div>
                    <div>
                        <h2 className="heading-outfit font-black text-xl text-slate-900 tracking-tight leading-none">{campaignName}</h2>
                        <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{data.date} Performance Insight</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Raw Data Button */}
                    <Button
                        variant="glass"
                        size="md"
                        onClick={handleDownloadRaw}
                        icon={<Database size={16} className="text-slate-400" />}
                        className="uppercase tracking-tight text-xs font-bold raw-download-btn"
                        disabled={!rawExcelData}
                    >
                        Raw Data ({rawExcelData?.raw?.rows?.length || 0})
                    </Button>
                    <Button
                        variant="glass"
                        size="md"
                        onClick={saveAsHTML}
                        icon={<FileDown size={18} className="text-slate-400" />}
                        className="uppercase tracking-tight text-xs font-bold"
                    >
                        HTML
                    </Button>
                    <Button
                        variant="primary"
                        size="md"
                        onClick={saveAsPDF}
                        icon={<FileDown size={18} />}
                        className="uppercase tracking-tight text-xs font-bold"
                        style={{ backgroundColor: 'var(--brand-color)' }}
                    >
                        PDF Export
                    </Button>
                </div>

            </div>

            <div ref={reportRef} className="report-page bg-white box-border text-slate-900 mx-auto overflow-hidden shadow-2xl" style={{ width: '820px', minHeight: 'auto' }}>
                {/* Header Section Match */}
                <header className="text-white pb-20 pt-12 px-12 relative overflow-hidden" style={{ backgroundColor: brandColor || data.brandColor }}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start relative z-10">
                        <div className="mb-4 md:mb-0">
                            <div className="text-white/70 font-black text-[9px] tracking-[0.2em] mb-2 uppercase opacity-80">Nashmedia Analytical Services</div>
                            <h1 className="text-3xl font-black mb-2 tracking-tighter leading-tight">{campaignName}</h1>
                            <p className="text-white/80 text-[11px] font-bold tracking-tight bg-black/10 inline-block px-2 py-0.5 rounded-md border border-white/10 uppercase">Daily Performance Report</p>
                        </div>
                        <div className="text-right">
                            <div className="inline-flex items-center bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 shadow-sm">
                                <Calendar className="w-4 h-4 mr-2 text-white/70" />
                                <span className="font-bold text-sm">{data.date}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="px-12 -mt-10 relative z-20 pb-12">
                    {/* Highlight Box Match */}
                    <div className="bg-white rounded-[1.5rem] shadow-xl p-8 mb-8 border-l-[8px] flex gap-6 items-center" style={{ borderLeftColor: brandColor || data.brandColor || '#F58220' }}>
                        <div className="p-3 rounded-[1rem] bg-slate-50 flex items-center justify-center">
                            <BarChart3 className="w-8 h-8" style={{ color: brandColor || data.brandColor }} />
                        </div>
                        <div className="flex-1">
                            <h2
                                className="text-lg font-black text-slate-900 mb-1 heading-outfit outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-50 rounded px-1"
                                contentEditable
                                suppressContentEditableWarning
                            >Core Targeting Insight</h2>
                            <p
                                className="text-slate-500 leading-relaxed text-[13px] font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-50 rounded px-1"
                                contentEditable
                                suppressContentEditableWarning
                            >
                                <span className="font-black text-slate-900 underline decoration-slate-200 decoration-4 underline-offset-4">{data.advertiser || "광고주"}</span>의 이번 캠페인은
                                <span className="mx-1 font-black text-base" style={{ color: brandColor || data.brandColor }}>{data.overall.impressions.today.toLocaleString()}</span>회의 일일 노출을 기록하며
                                안정적인 퍼포먼스를 유지하고 있습니다. 특히 <span className="font-bold text-slate-700">실시간 성과 최적화</span>를 통해 {data.budgetAchievement}%의 예산 집행률을 달성했습니다.
                            </p>
                        </div>
                    </div>

                    <section className="mb-16">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900 text-white">
                                    <span className="text-xs font-black">01</span>
                                </div>
                                <h2 className="heading-outfit text-xl font-black tracking-tight">Core Performance Summary</h2>
                            </div>
                            <div className="h-px flex-1 mx-6 bg-slate-100"></div>
                        </div>
                        <PerformanceGrid stats={data.overall} />

                        {data.budgetTotal && data.budgetTotal > 0 && (
                            <div className="mt-10 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <div className="flex justify-between items-center gap-6">
                                    <div className="space-y-1 shrink-0">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Campaign Budget Achievement</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black heading-outfit text-slate-900">{data.budgetAchievement}%</span>
                                            <span className="text-xs text-slate-400 font-bold">of ₩{data.budgetTotal.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-white h-5 rounded-full overflow-hidden p-1 border border-slate-100">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 shadow-sm"
                                            style={{
                                                width: `${Math.min(data.budgetAchievement || 0, 100)}%`,
                                                backgroundColor: 'var(--brand-color)'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="mb-16">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900 text-white">
                                    <span className="text-xs font-black">02</span>
                                </div>
                                <h2 className="heading-outfit text-xl font-black tracking-tight">Performance Comparison</h2>
                            </div>
                            <div className="h-px flex-1 mx-6 bg-slate-100"></div>
                        </div>

                        <div className="space-y-12">
                            {/* Media Section */}
                            {data.mediaComparison && data.mediaComparison.length > 0 && (
                                <div className="space-y-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                        Media Performance Analysis
                                    </h3>
                                    <div className="space-y-8">
                                        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">Impression Share by Media</h4>
                                            <ResponsiveContainer width="100%" height={mediaChartHeight}>
                                                <BarChart data={mediaChartData} layout="vertical" margin={{ left: 60, right: 30, top: 10, bottom: 10 }} barSize={16}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                                    <XAxis type="number" hide />
                                                    <YAxis
                                                        dataKey="name"
                                                        type="category"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 800 }}
                                                        width={80}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
                                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                                    />
                                                    <Bar dataKey="today" fill="var(--brand-color)" radius={[0, 8, 8, 0]} animationDuration={1500} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <MediaComparisonTable
                                            data={data.mediaComparison}
                                            brandColor={brandColor || data.brandColor}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Creative Section */}
                            {data.creativeComparison && data.creativeComparison.length > 0 && (
                                <div className="pt-12 border-t border-slate-100 space-y-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        Creative Performance Analysis
                                    </h3>
                                    <MediaComparisonTable data={data.creativeComparison} brandColor={brandColor || data.brandColor} />
                                </div>
                            )}
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900 text-white">
                                    <span className="text-xs font-black">03</span>
                                </div>
                                <h2 className="heading-outfit text-xl font-black tracking-tight">AI Strategy & Insights</h2>
                            </div>
                            <div className="h-px flex-1 mx-6 bg-slate-100 hidden md:block"></div>
                        </div>
                        <AIReportCard insight={insightText} insight_summary={data.insight_summary} onUpdate={handleInsightUpdate} />
                    </section>

                </main>

                <footer className="mt-8 pb-12 px-12 flex justify-between items-center opacity-40">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">© 2026 Nashmedia DMP • Confidental Intelligence Report</p>
                </footer>
            </div>
        </ReportLayout>
    );
};

export default DailyReportTemplate;
