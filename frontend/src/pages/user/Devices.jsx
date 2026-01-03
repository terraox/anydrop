import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Laptop, Tablet, Battery, Wifi, Play, Pause, SkipForward, Power, Radio, ShieldAlert } from 'lucide-react';
import ShineBorder from '../../components/magicui/ShineBorder';
import { toast } from 'sonner';

const DEVICES = [
    { id: 1, name: 'MacBook Pro M3', type: 'laptop', battery: 84, status: 'online', current: true },
    { id: 2, name: 'iPhone 15 Pro', type: 'mobile', battery: 42, status: 'online', current: false },
    { id: 3, name: 'iPad Air 5', type: 'tablet', battery: 12, status: 'sleep', current: false },
];

export default function Devices() {
    const [sentryMode, setSentryMode] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePing = (deviceName) => {
        toast.info(`Pinging ${deviceName}...`);
    };

    const toggleSentry = () => {
        setSentryMode(!sentryMode);
        toast(sentryMode ? "Sentry Mode Deactivated" : "Sentry Mode Activated - Scanning Grid");
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">

            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Command Center</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Manage your neural link ecosystem.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {DEVICES.map((device) => {
                    const isLowBattery = device.battery < 20;

                    const CardContent = (
                        <div className="relative p-6 h-full flex flex-col gap-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden">

                            {/* Device Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
                                        {device.type === 'laptop' && <Laptop className="w-6 h-6" />}
                                        {device.type === 'mobile' && <Smartphone className="w-6 h-6" />}
                                        {device.type === 'tablet' && <Tablet className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900 dark:text-white">{device.name}</h3>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
                                            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{device.status}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Battery Gauge */}
                                <div className="relative w-12 h-12 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="24" cy="24" r="20" className="stroke-zinc-200 dark:stroke-zinc-800 fill-none" strokeWidth="4" />
                                        <circle
                                            cx="24" cy="24" r="20"
                                            className={`fill-none transition-all duration-1000 ${isLowBattery ? 'stroke-red-500' : device.battery < 50 ? 'stroke-yellow-500' : 'stroke-emerald-500'
                                                }`}
                                            strokeWidth="4"
                                            strokeDasharray="125.6"
                                            strokeDashoffset={125.6 - (125.6 * device.battery) / 100}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <span className="absolute text-[10px] font-bold text-zinc-900 dark:text-white">{device.battery}%</span>
                                </div>
                            </div>

                            {/* Sentry Mode Overlay */}
                            {sentryMode && (
                                <div className="absolute inset-0 bg-red-500/5 z-0 pointer-events-none">
                                    <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_1px,rgba(239,68,68,0.1)_1px,rgba(239,68,68,0.1)_2px)] bg-[length:100%_4px] animate-scan" />
                                    <div className="absolute top-4 right-4 animate-pulse">
                                        <ShieldAlert className="w-6 h-6 text-red-500" />
                                    </div>
                                </div>
                            )}

                            {/* Controls */}
                            <div className="mt-auto grid grid-cols-2 gap-3 relative z-10">
                                <button
                                    onClick={() => handlePing(device.name)}
                                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium text-zinc-900 dark:text-white group"
                                >
                                    <Radio className="w-4 h-4 group-hover:animate-ping" /> Ping
                                </button>
                                <button
                                    onClick={toggleSentry}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-colors text-sm font-medium border ${sentryMode
                                            ? 'bg-red-500/10 border-red-500 text-red-500'
                                            : 'bg-zinc-100 dark:bg-zinc-800 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white'
                                        }`}
                                >
                                    <ShieldAlert className="w-4 h-4" /> Sentry
                                </button>
                            </div>

                            {/* Media Controls (Only for Mobile) */}
                            {device.type === 'mobile' && (
                                <div className="bg-zinc-900 dark:bg-black rounded-xl p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                                            <Wifi className="w-5 h-5 text-zinc-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-400">Now Playing</p>
                                            <p className="text-sm font-bold text-white truncate w-24">Cyberpunk 2077 OST</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 rounded-full bg-white text-black hover:scale-105 transition-transform">
                                            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                        </button>
                                        <button className="p-2 text-zinc-400 hover:text-white">
                                            <SkipForward className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );

                    return (
                        <motion.div
                            key={device.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: device.id * 0.1 }}
                            className="col-span-1"
                        >
                            {device.current ? (
                                <ShineBorder
                                    className="h-full w-full !p-0 !bg-transparent rounded-2xl border-transparent"
                                    color={["#8B5CF6", "#06B6D4", "#10B981"]}
                                >
                                    {CardContent}
                                </ShineBorder>
                            ) : (
                                CardContent
                            )}
                        </motion.div>
                    );
                })}
            </div>

        </div>
    );
}
