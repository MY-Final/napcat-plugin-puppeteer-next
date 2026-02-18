import type { PageId } from '../App'
import {
    LayoutGrid,
    Zap,
    FileText,
    Settings,
    Github,
    RotateCcw
} from 'lucide-react'
import { authFetch } from '../utils/api'
import { showToast } from '../hooks/useToast'

interface SidebarProps {
    currentPage: PageId
    onPageChange: (page: PageId) => void
}

const menuItems: { id: PageId; label: string; icon: React.ReactNode }[] = [
    { id: 'status', label: '仪表盘', icon: <LayoutGrid size={20} /> },
    { id: 'test', label: '截图调试', icon: <Zap size={20} /> },
    { id: 'settings', label: '系统设置', icon: <Settings size={20} /> },
    { id: 'api', label: '接口文档', icon: <FileText size={20} /> },
]

const PLUGIN_VERSION = 'v1.0.0'

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
    // 重启浏览器
    const restartBrowser = async () => {
        showToast('正在重启浏览器...', 'info')
        try {
            const data = await authFetch('/browser/restart', { method: 'POST' })
            if (data.code === 0) {
                showToast(data.message || '浏览器已重启', 'success')
            } else {
                showToast('重启失败: ' + data.message, 'error')
            }
        } catch (e) {
            showToast('重启失败: ' + (e as Error).message, 'error')
        }
    }

    return (
        <aside className="w-64 flex-shrink-0 bg-white dark:bg-[#1a1b1d] border-r border-gray-200 dark:border-gray-800 flex flex-col z-10">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3 mb-2">
                <div className="w-8 h-8 flex items-center justify-center bg-gray-900 dark:bg-white rounded-lg text-white dark:text-black">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 17 12 22 22 17"></polyline>
                        <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                </div>
                <div>
                    <h1 className="font-bold text-sm leading-tight tracking-tight text-gray-900 dark:text-white">napcat-plugin-puppeteer-next</h1>
                    <p className="text-[10px] text-gray-500 font-medium">Next Generation</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-1">
                {menuItems.map((item) => (
                    <div
                        key={item.id}
                        className={`sidebar-item ${currentPage === item.id ? 'active' : ''}`}
                        onClick={() => onPageChange(item.id)}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </div>
                ))}
            </nav>

            {/* Quick Actions */}
            <div className="px-3 pb-2 mt-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase px-3 py-2 tracking-wider">快捷操作</div>
                <div className="space-y-1">
                    <button
                        onClick={restartBrowser}
                        className="w-full sidebar-item text-left no-underline hover:bg-amber-500/10 hover:text-amber-500"
                    >
                        <RotateCcw size={20} />
                        <span>重启浏览器</span>
                    </button>
                </div>
            </div>

            {/* Footer Links */}
            <div className="px-3 pb-2 mt-2">
                <a
                    href="https://github.com/MY-Final/napcat-plugin-puppeteer-next/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-item no-underline"
                >
                    <Github size={20} />
                    <span>反馈问题</span>
                </a>
            </div>

            {/* Version & Theme Indicator */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500 font-mono">{PLUGIN_VERSION}</span>
                </div>
                <div className="flex items-center justify-center w-full p-2 rounded-lg text-gray-500 bg-gray-50 dark:bg-gray-800/50 cursor-default">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                    <span className="ml-2 text-xs">跟随系统主题</span>
                </div>
            </div>
        </aside>
    )
}
