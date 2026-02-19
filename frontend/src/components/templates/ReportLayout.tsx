import React from 'react';

interface ReportLayoutProps {
    children: React.ReactNode;
    brandColor?: string;
}

const ReportLayout: React.FC<ReportLayoutProps> = ({ children, brandColor = '#4f46e5' }) => {
    const themeStyle = {
        '--brand-color': brandColor,
        '--brand-color-light': brandColor.replace('60%', '95%'), // Simplified for now
    } as React.CSSProperties;

    return (
        <div className="bg-[#f8fafc] py-6 md:py-12 min-h-screen font-sans" style={themeStyle}>
            <div className="report-page bg-white w-full max-w-[1200px] mx-auto p-6 md:p-12 md:rounded-[2.5rem] md:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] border border-slate-100 box-border text-slate-900 overflow-hidden">
                {children}
            </div>
        </div>
    );
};

export default ReportLayout;
