import React from 'react';
import { Zap } from 'lucide-react';
import Badge from '../atoms/Badge';

interface AIReportCardProps {
    insight: string;
    insight_summary?: string;
    onUpdate?: (newInsight: string) => void;
}

const AIReportCard: React.FC<AIReportCardProps> = ({ insight, insight_summary, onUpdate }) => {
    const displayContent = insight_summary || insight;

    const handleBlur = (e: React.FormEvent<HTMLDivElement>) => {
        if (onUpdate) {
            const newText = e.currentTarget.innerText;
            // Only update if changed (simple check)
            if (newText !== displayContent) {
                onUpdate(newText);
            }
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-7 border-l-8 flex flex-col md:flex-row items-start md:items-center gap-6" style={{ borderLeftColor: '#F58220' }}>
            <div className="bg-orange-50 p-3 rounded-full min-w-fit">
                <Zap className="w-8 h-8 text-[#F58220]" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">DMP Strategic Insight</h3>
                <div
                    className={`text-gray-600 leading-relaxed text-[12.5px] whitespace-pre-wrap font-medium prose prose-sm max-w-none ${onUpdate ? 'cursor-text hover:bg-slate-50 p-1 rounded transition-colors ring-offset-2 focus:ring-2 focus:ring-indigo-500 outline-none' : ''}`}
                    contentEditable={!!onUpdate}
                    suppressContentEditableWarning={true}
                    onBlur={handleBlur}
                >
                    {displayContent}
                </div>
                {insight_summary && insight && (
                    <details className="mt-4 group">
                        <summary className="text-[11px] font-bold text-slate-400 cursor-pointer hover:text-slate-600 transition-colors list-none flex items-center gap-1 uppercase tracking-wider">
                            <span className="group-open:rotate-180 transition-transform inline-block">▼</span>
                            Detailed Analysis Content
                        </summary>
                        <div className="mt-3 text-[12px] text-slate-500 border-t border-slate-100 pt-3 leading-relaxed">
                            {insight}
                        </div>
                    </details>
                )}
            </div>
        </div>
    );
};

export default AIReportCard;
