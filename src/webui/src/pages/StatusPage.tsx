import { useState, useEffect } from 'react'
import { Play, RotateCcw, Square, Shield, CheckCircle, XCircle, Globe, Laptop, Lock } from 'lucide-react'
import type { PluginStatus } from '../types'
import { authFetch } from '../utils/api'
import { showToast } from '../hooks/useToast'

interface StatusPageProps {
    status: PluginStatus | null
    onRefresh: () => void
}

// 格式化运行时长
function formatUptime(uptimeMs: number): string {
    const seconds = Math.floor(uptimeMs / 1000)
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (days > 0) {
        return `${days}天 ${hours}小时 ${minutes}分 ${secs}秒`
    } else if (hours > 0) {
        return `${hours}小时 ${minutes}分 ${secs}秒`
    } else if (minutes > 0) {
        return `${minutes}分 ${secs}秒`
    } else {
        return `${secs}秒`
    }
}

// 计算成功率
function calculateSuccessRate(total: number, failed: number): number {
    if (total === 0) return 100
    return Math.round(((total - failed) / total) * 100)
}

// 获取成功率颜色
function getSuccessRateColor(rate: number): string {
    if (rate >= 95) return 'text-green-500'
    if (rate >= 80) return 'text-amber-500'
    return 'text-red-500'
}

export default function StatusPage({ status, onRefresh }: StatusPageProps) {
    const browser = status?.browser
    const [displayUptime, setDisplayUptime] = useState<string>('-')
    const [syncInfo, setSyncInfo] = useState<{ baseUptime: number; syncTime: number } | null>(null)

    // 当 status.uptime 变化时同步基准值
    useEffect(() => {
        if (status?.uptime !== undefined && status.uptime > 0) {
            setSyncInfo({
                baseUptime: status.uptime,
                syncTime: Date.now()
            })
        }
    }, [status?.uptime])

    // 每秒更新显示
    useEffect(() => {
        if (!syncInfo) {
            setDisplayUptime('-')
            return
        }

        const updateUptime = () => {
            const elapsed = Date.now() - syncInfo.syncTime
            setDisplayUptime(formatUptime(syncInfo.baseUptime + elapsed))
        }

        updateUptime()
        const interval = setInterval(updateUptime, 1000)
        return () => clearInterval(interval)
    }, [syncInfo])

    const browserAction = async (action: string, name: string) => {
        showToast(`正在${name}浏览器...`, 'info')
        try {
            const data = await authFetch('/browser/' + action, { method: 'POST' })
            const success = data.code === 0
            showToast(data.message || (success ? `${name}成功` : `${name}失败`), success ? 'success' : 'error')
            setTimeout(onRefresh, 1000)
        } catch (e) {
            showToast(`${name}失败: ` + (e as Error).message, 'error')
        }
    }

    const totalRenders = browser?.totalRenders || 0
    const failedRenders = browser?.failedRenders || 0
    const successRate = calculateSuccessRate(totalRenders, failedRenders)
    const successRateColor = getSuccessRateColor(successRate)

    return (
        <div className="space-y-6">
            {/* 实时状态卡片 */}
            <div className="glass-card p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">实时状态</h3>
                    <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${browser?.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        <span className={`text-sm font-medium ${browser?.connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {browser?.connected ? '运行中' : '未连接'}
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#1a1b1d] rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <Shield size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">浏览器状态</div>
                            <div className={`font-semibold ${browser?.connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {browser?.connected ? (browser?.mode === 'remote' ? '远程连接' : '本地运行') : '未连接'}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#1a1b1d] rounded-lg">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                            <Globe size={20} className="text-purple-500" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">当前页面数</div>
                            <div className="font-semibold text-gray-800 dark:text-gray-200">{browser?.pageCount || 0} 个</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#1a1b1d] rounded-lg">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                            <CheckCircle size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">运行时长</div>
                            <div className="font-semibold text-gray-800 dark:text-gray-200">{displayUptime}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="glass-card p-6 border-l-4 border-l-primary/60">
                    <div className="text-gray-500 text-sm mb-2 font-medium">总渲染次数</div>
                    <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{totalRenders}</div>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-red-500/60">
                    <div className="text-gray-500 text-sm mb-2 font-medium">失败次数</div>
                    <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{failedRenders}</div>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-blue-500/60">
                    <div className="text-gray-500 text-sm mb-2 font-medium">当前页面数</div>
                    <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{browser?.pageCount || 0}</div>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-green-500/60">
                    <div className="text-gray-500 text-sm mb-2 font-medium">成功率</div>
                    <div className={`text-3xl font-bold ${successRateColor}`}>{successRate}%</div>
                </div>
            </div>

            {/* Browser Control */}
            <div className="glass-card p-6 mb-8">
                <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100">浏览器控制</h3>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-primary/80">
                            <Shield size={24} />
                        </div>
                        <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">实例管理</div>
                            <div className="text-sm text-gray-500">控制 Puppeteer 浏览器生命周期</div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => browserAction('start', '启动')}
                            className="btn bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm"
                        >
                            <Play size={18} className="text-green-500" />
                            启动
                        </button>
                        <button
                            onClick={() => browserAction('restart', '重启')}
                            className="btn bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm"
                        >
                            <RotateCcw size={18} className="text-amber-500" />
                            重启
                        </button>
                        <button
                            onClick={() => browserAction('stop', '停止')}
                            className="btn bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm"
                        >
                            <Square size={18} className="text-red-500" />
                            停止
                        </button>
                    </div>
                </div>
            </div>

            {/* System Info */}
            <div className="glass-card p-6">
                <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100">系统信息</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-[#1a1b1d] rounded-lg border border-gray-100 dark:border-gray-800">
                        <span className="text-gray-500">连接状态</span>
                        <span className={`font-medium flex items-center gap-1 ${browser?.connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {browser?.connected ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            {browser?.connected ? '已连接' : '未连接'}
                        </span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-[#1a1b1d] rounded-lg border border-gray-100 dark:border-gray-800">
                        <span className="text-gray-500">连接模式</span>
                        <span className={`font-medium flex items-center gap-1 ${browser?.mode === 'remote' ? 'text-blue-500' : 'text-gray-500'}`}>
                            {browser?.mode === 'remote' ? <Globe size={14} /> : <Laptop size={14} />}
                            {browser?.mode === 'remote' ? '远程连接' : '本地启动'}
                        </span>
                    </div>

                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-[#1a1b1d] rounded-lg border border-gray-100 dark:border-gray-800">
                        <span className="text-gray-500">浏览器版本</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{browser?.version || '-'}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-[#1a1b1d] rounded-lg border border-gray-100 dark:border-gray-800">
                        <span className="text-gray-500 flex-shrink-0 mr-4">浏览器地址</span>
                        <span
                            className="font-medium truncate font-mono text-xs text-gray-800 dark:text-gray-200"
                            title={browser?.mode === 'remote' ? browser?.browserWSEndpoint : browser?.executablePath}
                        >
                            {browser?.mode === 'remote' ? browser?.browserWSEndpoint : browser?.executablePath || '-'}
                        </span>
                    </div>

                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-[#1a1b1d] rounded-lg border border-gray-100 dark:border-gray-800">
                        <span className="text-gray-500 flex items-center gap-1">
                            <Lock size={12} />
                            代理服务器
                        </span>
                        <span
                            className={`font-medium truncate font-mono text-xs ${browser?.proxy?.server ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400'}`}
                            title={browser?.proxy?.server}
                        >
                            {browser?.proxy?.server || '未配置'}
                        </span>
                    </div>
                    {browser?.proxy?.server && (
                        <div className="flex justify-between p-3 bg-gray-50 dark:bg-[#1a1b1d] rounded-lg border border-gray-100 dark:border-gray-800">
                            <span className="text-gray-500 flex items-center gap-1">
                                <Globe size={12} />
                                Bypass 列表
                            </span>
                            <span
                                className="font-medium truncate font-mono text-xs text-gray-800 dark:text-gray-200"
                                title={browser?.proxy?.bypassList}
                            >
                                {browser?.proxy?.bypassList || '-'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
