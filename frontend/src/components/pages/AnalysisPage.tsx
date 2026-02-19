'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, History } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { AnalysisResponse } from '../../types/report';
import { generateBrandColor } from '../../utils/colorUtils';
import DashboardLayout from '../templates/DashboardLayout';
import UploadZone from '../molecules/UploadZone';
import Button from '../atoms/Button';
import DailyReportTemplate from '../organisms/DailyReportTemplate';
import HistoryList from '../molecules/HistoryList';
import { parseExcel } from '../../utils/excel';
import { mockReportData } from '../../mocks/reportMock';
import { storageService } from '../../utils/storage';


const AnalysisPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [reportData, setReportData] = useState<AnalysisResponse | null>(null);
    const [excelData, setExcelData] = useState<{ fileName: string; raw: any; originalRaw?: any; mediaMix: any } | null>(null);
    const [campaignName, setCampaignName] = useState<string>("Campaign Report");
    const [error, setError] = useState<string | null>(null);

    // History State
    const [showHistory, setShowHistory] = useState(false);
    const [historyItems, setHistoryItems] = useState<any[]>([]);

    useEffect(() => {
        if (showHistory) {
            loadHistory();
        }
    }, [showHistory]);

    const loadHistory = async () => {
        try {
            // Load from LocalStorage
            const data = storageService.getAll();
            setHistoryItems(data);
        } catch (e) {
            console.error("Failed to load history", e);
        }
    };

    const handleHistorySelect = async (id: string) => {
        setIsLoading(true);
        try {
            // Get from LocalStorage
            const item = storageService.getById(id);
            if (item && item.report) {
                // If raw data exists in history, restore it
                if (item.raw) {
                    setExcelData({
                        fileName: `Report_${item.report.date}`,
                        raw: { rows: item.raw.raw_rows },
                        mediaMix: { rows: item.raw.mix_rows }
                    });
                }

                // Ensure ID is present in report object for updates
                const reportWithId = { ...item.report, id: id };
                setReportData(reportWithId);
                setCampaignName(item.report.advertiser ? `${item.report.advertiser}_Report` : "Saved_Report");
                setShowHistory(false);
            }
        } catch (e) {
            setError("리포트를 불러오는 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await parseExcel(file);
            setExcelData({
                fileName: data.fileName,
                raw: data.raw,
                originalRaw: data.originalRaw, // Store original raw 
                mediaMix: data.mediaMix
            });
            setCampaignName(data.fileName.split('.')[0]);
        } catch (err: any) {
            console.error("File upload error:", err);
            setError("엑셀 파일을 읽는 중 오류가 발생했습니다. 파일 형식을 확인해 주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    const runMockAnalysis = () => {
        setCampaignName("동국제약_카리토포텐_12월_결과리포트");
        setReportData(mockReportData);
    };


    const runAnalysis = async () => {
        if (!excelData) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await apiService.analyze({
                raw_rows: excelData.raw.rows,
                mix_rows: excelData.mediaMix.rows,
                mappings: {
                    raw_mapping: {
                        date_col: "날짜",
                        media_col: "매체",
                        imp_col: "노출수",
                        click_col: "클릭수",
                        cost_col: "지출",
                        advertiser_col: "광고주"
                    }
                }
            });

            if (result.error) throw new Error(result.error);

            const brandColor = result.advertiser ? generateBrandColor(result.advertiser) : '#4f46e5';
            const finalResult = { ...result, brandColor };

            // Auto-save to LocalStorage
            const savedId = storageService.saveReport(finalResult, { raw_rows: excelData.raw.rows, mix_rows: excelData.mediaMix.rows });
            finalResult.id = savedId;

            setReportData(finalResult);
        } catch (err: any) {
            setError(err.message || "분석 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    // Handler for updates from the template (editable fields)
    const handleUpdateReport = async (updatedData: AnalysisResponse) => {
        setReportData(updatedData);
        if (updatedData.id) {
            try {
                storageService.updateReport(updatedData.id, updatedData);
            } catch (e) {
                console.error("Failed to auto-save report", e);
            }
        }
    };

    const handleNavigation = (label: string) => {
        if (label === 'History') {
            setShowHistory(true);
        } else if (label === 'Analytics') {
            setShowHistory(false);
            setReportData(null); // Reset view to upload/history list
        }
    };

    return (
        <DashboardLayout
            sidebarActiveItem={showHistory ? 'History' : 'Analytics'}
            onNavigate={handleNavigation}
        >
            {!reportData ? (
                <div className="h-full flex flex-col p-6 md:p-12 items-center justify-center">
                    <div className="w-full max-w-2xl">
                        <div className="mb-12 text-center md:text-left flex justify-between items-end">
                            <div>
                                <h2 className="heading-outfit text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                                    Prepare your <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">Insight</span>
                                </h2>
                                <p className="mt-4 text-slate-500 font-medium text-lg">엑셀 데이터를 업로드하여 전문적인 광고 성과 보고서를 생성하세요.</p>
                            </div>
                            <Button
                                variant="glass"
                                size="sm"
                                onClick={() => setShowHistory(!showHistory)}
                                className={showHistory ? 'ring-2 ring-indigo-500 bg-indigo-50 text-indigo-700' : ''}
                            >
                                <History size={16} className="mr-2" />
                                {showHistory ? 'Upload New' : 'History'}
                            </Button>
                        </div>

                        {showHistory ? (
                            <div className="glass p-6 rounded-[2rem] premium-shadow animate-in fade-in slide-in-from-bottom-5 duration-700 min-h-[400px]">
                                <HistoryList
                                    history={historyItems}
                                    onSelect={handleHistorySelect}
                                    isLoading={false}
                                />
                            </div>
                        ) : (
                            <div className="glass p-8 rounded-[2rem] premium-shadow animate-in fade-in slide-in-from-bottom-5 duration-700">
                                <UploadZone fileName={excelData?.fileName} onFileChange={handleFileUpload} />

                                {error && (
                                    <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 animate-in shake duration-500">
                                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                        <p className="text-sm font-semibold">{error}</p>
                                    </div>
                                )}

                                <Button
                                    onClick={runAnalysis}
                                    isLoading={isLoading}
                                    disabled={!excelData}
                                    variant="dark"
                                    size="xl"
                                    className="w-full mt-8"
                                >
                                    Start Real-time Analysis
                                </Button>

                                <Button
                                    onClick={runMockAnalysis}
                                    variant="glass"
                                    size="md"
                                    className="w-full mt-4 text-slate-500 uppercase tracking-widest text-[10px] font-black"
                                >
                                    🧪 View Mock Report (Demo)
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500">
                    <DailyReportTemplate
                        data={reportData}
                        campaignName={campaignName}
                        insightText={reportData.insight || ""}
                        brandColor={reportData.brandColor}
                        // @ts-ignore
                        rawExcelData={excelData}
                        onUpdate={handleUpdateReport}
                    />
                    <Button
                        onClick={() => setReportData(null)}
                        variant="glass"
                        className="fixed bottom-8 right-8 z-[100]"
                    >
                        ← Back to Dashboard
                    </Button>
                </div>
            )}
        </DashboardLayout>
    );
};

export default AnalysisPage;
