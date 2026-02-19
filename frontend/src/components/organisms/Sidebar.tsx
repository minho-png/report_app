import React from 'react';
import { LayoutDashboard, BarChart3, Settings as SettingsIcon, History } from 'lucide-react';

interface SidebarProps {
    activeItem?: string;
    onNavigate?: (label: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem = 'Analytics', onNavigate }) => {
    const navItems = [
        { icon: BarChart3, label: 'Analytics' },
        { icon: History, label: 'History' },
        { icon: SettingsIcon, label: 'Settings' }
    ];

    return (
        <aside className="w-20 md:w-64 bg-slate-900 flex flex-col items-center md:items-stretch transition-all duration-300 z-50">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <LayoutDashboard className="text-white" size={24} />
                </div>
                <span className="hidden md:block heading-outfit font-black text-xl text-white tracking-tighter">DMP PLATFORM</span>
            </div>

            <nav className="mt-8 flex-1 px-4 space-y-2">
                {navItems.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => onNavigate?.(item.label)}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeItem === item.label ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <item.icon size={20} />
                        <span className="hidden md:block font-semibold text-sm">{item.label}</span>
                    </button>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
