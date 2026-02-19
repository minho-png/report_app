import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'indigo' | 'emerald' | 'amber' | 'red' | 'slate';
    className?: string;
    icon?: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'indigo', className = '', icon }) => {
    const variants = {
        indigo: "bg-indigo-50 text-indigo-600",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
        red: "bg-red-50 text-red-600",
        slate: "bg-slate-100 text-slate-500",
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${variants[variant]} ${className}`}>
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
        </span>
    );
};

export default Badge;
