import React from 'react';
import { Activity, Cpu, HardDrive, Wifi, Clock, CheckCircle2, AlertTriangle, Server } from 'lucide-react';

export default function SystemHealth() {
    // Mock system stats
    const systemStats = {
        uptime: '14 days, 7 hours',
        memoryUsed: 62,
        cpuUsage: 24,
        diskUsage: 42,
        activeConnections: 847,
        apiLatency: '32ms',
    };

    const services = [
        { name: 'API Server', status: 'healthy', uptime: '99.99%' },
        { name: 'Database', status: 'healthy', uptime: '99.98%' },
        { name: 'File Storage', status: 'healthy', uptime: '100%' },
        { name: 'WebSocket Server', status: 'healthy', uptime: '99.95%' },
        { name: 'Background Jobs', status: 'warning', uptime: '98.50%' },
    ];

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">System Health</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Monitor server performance and status.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800">
                    <Clock className="h-4 w-4" />
                    Uptime: {systemStats.uptime}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* CPU Usage */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">CPU Usage</h3>
                        <Cpu className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-3">{systemStats.cpuUsage}%</div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-full rounded-full bg-violet-500" style={{ width: `${systemStats.cpuUsage}%` }}></div>
                    </div>
                </div>

                {/* Memory Usage */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Memory</h3>
                        <Server className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-3">{systemStats.memoryUsed}%</div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-full rounded-full bg-violet-500" style={{ width: `${systemStats.memoryUsed}%` }}></div>
                    </div>
                </div>

                {/* Disk Usage */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Disk</h3>
                        <HardDrive className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-3">{systemStats.diskUsage}%</div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${systemStats.diskUsage}%` }}></div>
                    </div>
                </div>

                {/* Active Connections */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Connections</h3>
                        <Wifi className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold text-zinc-900 dark:text-white">{systemStats.activeConnections}</div>
                    <p className="text-xs text-zinc-500 mt-2">Active WebSocket connections</p>
                </div>
            </div>

            {/* Services Status */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Activity className="h-5 w-5 text-violet-500" />
                        Service Status
                    </h3>
                </div>
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {services.map((service, i) => (
                        <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                {service.status === 'healthy' ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : (
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                )}
                                <span className="font-medium text-zinc-900 dark:text-zinc-200">{service.name}</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-sm text-zinc-500">Uptime: {service.uptime}</span>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border capitalize ${service.status === 'healthy'
                                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20'
                                        : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/20'
                                    }`}>
                                    {service.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
