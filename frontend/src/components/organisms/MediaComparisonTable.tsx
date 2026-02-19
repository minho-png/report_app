import React from 'react';
import { MediaComparison } from '../../types/report';

interface MediaComparisonTableProps {
    data: MediaComparison[];
    brandColor?: string;
    budgetMap?: Record<string, number>;
}

const MediaComparisonTable: React.FC<MediaComparisonTableProps> = ({ data, brandColor = '#4f46e5' }) => {
    return (
        <div className="card overflow-hidden bg-white rounded-xl border border-gray-100 shadow-sm print:break-inside-avoid">
            <div className="overflow-x-auto">
                <table className="w-full text-[13px] text-left text-gray-500">
                    <thead className="text-[9px] text-gray-700 uppercase bg-gray-50 font-black tracking-widest border-b border-gray-100">
                        <tr>
                            <th scope="col" className="px-6 py-4">매체 / 채널</th>
                            <th scope="col" className="px-6 py-4 text-right">일일 노출</th>
                            <th scope="col" className="px-6 py-4 text-right">누적 노출</th>
                            <th scope="col" className="px-6 py-4 text-right">클릭수</th>
                            <th scope="col" className="px-6 py-4 text-center">비중</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((m, idx) => {
                            const totalImp = data.reduce((acc, curr) => acc + curr.metrics.impressions.today, 0);
                            const share = totalImp > 0 ? (m.metrics.impressions.today / totalImp * 100).toFixed(1) : '0.0';

                            return (
                                <tr key={idx} className="bg-white hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: brandColor }}></span>
                                            {m.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-500">{m.metrics.impressions.today.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-black text-slate-800">{m.metrics.impressions.total?.toLocaleString() || m.metrics.impressions.today.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-gray-400">{m.metrics.clicks.today.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: brandColor }}></div>
                                            </div>
                                            <span className="text-[9px] font-black text-gray-400">{share}%</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MediaComparisonTable;
