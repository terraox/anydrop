import React, { useState } from 'react';
import { Users, HardDrive, Wifi, ArrowUpRight, Activity, Clock, Zap, TrendingUp } from 'lucide-react';
import NumberTicker from '../../components/magicui/NumberTicker';
import { useTheme } from 'next-themes';

// Mock Data for the chart display
const trafficData = [
    { name: 'Mon', files: 120 }, { name: 'Tue', files: 250 },
    { name: 'Wed', files: 180 }, { name: 'Thu', files: 310 },
    { name: 'Fri', files: 290 }, { name: 'Sat', files: 100 },
    { name: 'Sun', files: 140 },
];

// Recent activity mock data
const recentActivity = [
    { action: "New user registered", user: "alice@example.com", time: "2 min ago", color: "bg-emerald-500" },
    { action: "File transfer completed", user: "bob@example.com", time: "5 min ago", color: "bg-blue-500" },
    { action: "Pro plan activated", user: "charlie@example.com", time: "15 min ago", color: "bg-amber-500" },
    { action: "Large file uploaded (2.4 GB)", user: "diana@example.com", time: "1 hour ago", color: "bg-violet-500" },
];

export default function AdminDashboard() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

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
                        <NumberTicker value={1247} />
                    </div>
                    <p className="flex items-center text-xs mt-2 text-emerald-500">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +12% from last month
                    </p>
                </div>

                {/* Active Transfers */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Active Transfers</h3>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
                        <NumberTicker value={42} />
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">Currently in progress</p>
                </div>

                {/* Storage Used */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Storage Used</h3>
                        <HardDrive className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
                        856<span className="text-lg text-zinc-500 font-normal ml-1">GB</span>
                    </div>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-full rounded-full bg-violet-500" style={{ width: '42%' }}></div>
                    </div>
                </div>

                {/* Bandwidth */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Bandwidth Today</h3>
                        <Wifi className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
                        128<span className="text-lg text-zinc-500 font-normal ml-1">GB</span>
                    </div>
                    <p className="flex items-center text-xs mt-2 text-emerald-500">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Peak: 3.2 GB/min
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
                                        style={{ height: `${(day.files / 350) * 200}px` }}
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
                <div className="lg:col-span-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <h3 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-zinc-400" />
                        Recent Activity
                    </h3>
                    <div className="space-y-5">
                        {recentActivity.map((log, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <span className={`h-2 w-2 rounded-full ${log.color} mt-2 flex-shrink-0`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{log.action}</p>
                                    <p className="text-xs text-zinc-500 truncate">{log.user} • {log.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-2 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg transition-colors">
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
                        className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-violet-50 dark:hover:bg-violet-500/5 hover:border-orange-200 dark:hover:border-violet-500/20 transition-all group"
                    >
                        <action.icon className="h-5 w-5 text-zinc-400 group-hover:text-violet-500 transition-colors" />
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{action.label}</span>
                    </a>
                ))}
            </div>
        </>
    );
}
