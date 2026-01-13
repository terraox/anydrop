import React, { useState, useEffect } from 'react';
import { Users, HardDrive, Wifi, ArrowUpRight, Activity, Clock, Zap, TrendingUp, Loader2 } from 'lucide-react';
import NumberTicker from '../../components/magicui/NumberTicker';
import { useTheme } from 'next-themes';
import api from '../../services/api';
import { toast } from 'sonner';

export default function AdminDashboard() {
    const { resolvedTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalFiles: 0,
        totalSize: 0,
        bannedUsers: 0
    });
    const [activity, setActivity] = useState([]);
    const [trafficData, setTrafficData] = useState([]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, activityRes, chartRes] = await Promise.all([
                api.get('/admin/dashboard/stats'),
                api.get('/admin/dashboard/activity'),
                api.get('/admin/dashboard/transfers-chart')
            ]);

            setStats(statsRes.data);
            setActivity(activityRes.data);
            setTrafficData(chartRes.data);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            toast.error("Failed to load dashboard statistics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const formatBytes = (bytes) => {
        if (!bytes) return '0 GB';
        const gb = bytes / (1024 * 1024 * 1024);
        return gb.toFixed(1);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                <p className="text-zinc-500 text-sm animate-pulse">Synchronizing command center...</p>
            </div>
        );
    }

    return (
        <>
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Dashboard Overview</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Welcome back, Administrator</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    All Systems Operational
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Users */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Users</h3>
                        <Users className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
                        <NumberTicker value={stats.totalUsers} />
                    </div>
                    <p className="flex items-center text-xs mt-2 text-zinc-500">
                        {stats.activeUsers} active accounts
                    </p>
                </div>

                {/* Total Files */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Transfers</h3>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
                        <NumberTicker value={stats.totalFiles} />
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">Historical file count</p>
                </div>

                {/* Storage Used */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Storage Used</h3>
                        <HardDrive className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
                        {formatBytes(stats.totalSize)}<span className="text-lg text-zinc-500 font-normal ml-1">GB</span>
                    </div>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-full rounded-full bg-violet-500" style={{ width: '42%' }}></div>
                    </div>
                </div>

                {/* Banned Users */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Banned Users</h3>
                        <Zap className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
                        <NumberTicker value={stats.bannedUsers} />
                    </div>
                    <p className="flex items-center text-xs mt-2 text-zinc-500">
                        Restricted access
                    </p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Chart Section */}
                <div className="lg:col-span-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <h3 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Files Transferred (Last 7 Days)</h3>
                    <div className="h-[280px] w-full flex items-end justify-between gap-4 px-4">
                        {trafficData.map((day, i) => (
                            <div key={i} className="flex flex-col items-center flex-1 group">
                                <div className="w-full relative">
                                    <div
                                        className="w-full bg-gradient-to-t from-violet-500 to-violet-400 rounded-t-lg transition-all group-hover:from-violet-400 group-hover:to-orange-300"
                                        style={{ height: `${(day.files / Math.max(...trafficData.map(d => d.files), 1)) * 200}px` }}
                                    >
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-xs px-2 py-1 rounded">
                                            {day.files}
                                        </div>
                                    </div>
                                </div>
                                <span className="mt-3 text-xs text-zinc-500">{day.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity Section */}
                <div className="lg:col-span-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm overflow-hidden flex flex-col">
                    <h3 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-zinc-400" />
                        Recent Activity
                    </h3>
                    <div className="space-y-5 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                        {activity.map((log, i) => (
                            <div key={i} className="flex items-start gap-4 animate-in fade-in slide-in-from-right-2 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                                <span className={`h-2 w-2 rounded-full bg-violet-500 mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(139,92,246,0.5)]`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{log.action}</p>
                                    <p className="text-xs text-zinc-500 truncate">{log.user} • {log.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-auto pt-6 py-2 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg transition-colors border-t border-zinc-100 dark:border-zinc-800">
                        View All Activity
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { icon: Users, label: "Manage Users", href: "/admin/users" },
                    { icon: HardDrive, label: "View Files", href: "/admin/files" },
                    { icon: Zap, label: "Configure Plans", href: "/admin/plans" },
                    { icon: Activity, label: "System Health", href: "/admin/health" },
                ].map((action, i) => (
                    <a
                        key={i}
                        href={action.href}
                        className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-violet-50 dark:hover:bg-violet-500/5 hover:border-violet-200 dark:hover:border-violet-500/20 transition-all group shadow-sm"
                    >
                        <action.icon className="h-5 w-5 text-zinc-400 group-hover:text-violet-500 transition-colors" />
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{action.label}</span>
                    </a>
                ))}
            </div>
        </>
    );
}
