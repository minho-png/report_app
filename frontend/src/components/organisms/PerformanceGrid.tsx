import React from 'react';
import { OverallStats } from '../../types/report';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface Props {
    stats: OverallStats;
}

const PerformanceGrid: React.FC<Props> = ({ stats }) => {
    const Card = ({ label, value, prev, unit = "" }: { label: string, value: number, prev: number, unit?: string }) => {
        const delta = prev > 0 ? ((value - prev) / prev * 100) : 0;
        const isPositive = delta > 0;

        return (
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative overflow-hidden group hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-500">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <div className={`w-24 h-24 rounded-full blur-2xl ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                </div>

                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-baseline gap-1 relative z-10">
                    <h3 className="text-3xl font-black heading-outfit text-slate-900 tracking-tight">
                        {value.toLocaleString()}
                    </h3>
                    <span className="text-xs font-bold text-slate-400">{unit}</span>
                </div>

                <div className={`flex items-center gap-1 mt-4 text-xs font-bold ${isPositive ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {delta !== 0 ? (
                        <>
                            {isPositive ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
                            {Math.abs(delta).toFixed(1)}%
                        </>
                    ) : (
                        <>
                            <Minus size={14} strokeWidth={3} />
                            0.0%
                        </>
                    )}
                    <span className="text-slate-300 font-semibold ml-1">vs yesterday</span>
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card label="Impressions" value={stats.impressions.today} prev={stats.impressions.prev} />
            <Card label="Clicks" value={stats.clicks.today} prev={stats.clicks.prev} />
            <Card label="Spend" value={stats.spend.today} prev={stats.spend.prev} unit="₩" />
            {stats.views && (
                <Card label="Views" value={stats.views.today} prev={stats.views.prev} />
            )}
        </div>
    );
};

export default PerformanceGrid;
