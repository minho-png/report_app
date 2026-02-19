import React from 'react';
import Sidebar from '../organisms/Sidebar';

interface DashboardLayoutProps {
    children: React.ReactNode;
    sidebarActiveItem?: string;
    onNavigate?: (label: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, sidebarActiveItem, onNavigate }) => {
    return (
        <div className="flex h-screen bg-[#f1f5f9] font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
            <Sidebar activeItem={sidebarActiveItem} onNavigate={onNavigate} />
            <main className="flex-1 overflow-y-auto custom-scrollbar">
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
