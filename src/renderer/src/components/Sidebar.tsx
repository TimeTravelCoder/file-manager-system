
import { LayoutDashboard, PlusCircle, Settings, FolderArchive } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
    currentView: string;
    onViewChange: (view: 'dashboard' | 'create' | 'settings') => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
    const menuItems = [
        { id: 'dashboard', label: '我的文件', icon: LayoutDashboard },
        { id: 'create', label: '新建文件', icon: PlusCircle },
        { id: 'archive', label: '归档库', icon: FolderArchive }, // Placeholder
        { id: 'settings', label: '设置', icon: Settings },
    ];

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">F</span>
                    文件管理系统
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id as any)}
                        className={clsx(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium",
                            currentView === item.id
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-200">
                <div className="text-xs text-gray-400 text-center">
                    v1.0.0
                </div>
            </div>
        </div>
    );
}
