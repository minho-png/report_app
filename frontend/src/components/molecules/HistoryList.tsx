import React from 'react';
import { Calendar, Building2, ChevronRight, Clock } from 'lucide-react';
import { AnalysisResponse } from '../../types/report';

interface HistoryListProps {
    history: any[];
    onSelect: (id: string) => void;
    isLoading?: boolean;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, isLoading }) => {
    if (isLoading) {
        return <div className="p-8 text-center text-slate-400">Loading history...</div>;
    }

    if (!history || history.length === 0) {
        return (
            <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50">
                <p className="text-slate-400 font-medium">No history found</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-1">Recent Reports</h3>
            {history.map((item) => (
                <div
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className="group bg-white p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-pointer relative overflow-hidden"
                >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-indigo-500 transition-colors" style={{ backgroundColor: item.brandColor }}></div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                <Building2 size={18} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">
                                    {item.advertiser || 'Unknown Advertiser'}
                                </h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="flex items-center text-[11px] text-slate-400 font-semibold bg-slate-50 px-2 py-0.5 rounded-full">
                                        <Calendar size={10} className="mr-1.5" />
                                        {item.date}
                                    </span>
                                    <span className="flex items-center text-[10px] text-slate-300">
                                        <Clock size={10} className="mr-1" />
                                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default HistoryList;
