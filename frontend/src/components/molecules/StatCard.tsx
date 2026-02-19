import React from 'react';
import Badge from '../atoms/Badge';

interface StatCardProps {
    label: string;
    value: string | number;
    prevValue?: string | number;
    totalValue?: string | number;
    delta?: number;
    isUp?: boolean;
    icon: React.ReactNode;
    variant?: 'indigo' | 'emerald' | 'amber' | 'red' | 'rose';
}

const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    prevValue,
    totalValue,
    delta,
    isUp,
    icon,
    variant = 'indigo'
}) => {
    return (
        <div className="card p-5 border-t-4 bg-white rounded-xl shadow-sm border-slate-100 flex flex-col justify-between" style={{ borderTopColor: 'var(--brand-color)' }}>
            <div className="flex justify-between items-start mb-3">
                <div>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</p>
                    <h3 className="text-xl font-black text-gray-800 tracking-tight">{value}</h3>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg opacity-60">
                    {icon}
                </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-50">
                {delta !== undefined && (
                    <div className="flex items-center text-[10px] font-black" style={{ color: isUp ? '#10b981' : '#ef4444' }}>
                        <span className="mr-1">{isUp ? '▲' : '▼'}</span>
                        <span>전일 대비 {delta > 0 ? `+${delta}` : delta}%</span>
                    </div>
                )}
                {totalValue !== undefined && (
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span className="uppercase opacity-70">Cumulative</span>
                        <span className="text-slate-600 font-black">{totalValue}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
