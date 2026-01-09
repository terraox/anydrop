import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Laptop, Smartphone, Wifi, X, CheckCircle, Search } from 'lucide-react';
import ShineBorder from '../../components/magicui/ShineBorder';

export default function DeviceSelectionModal({ isOpen, onClose, onSelect, devices = [] }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Select Recipient</h2>
                            <p className="text-sm text-zinc-500">Choose a device to receive the file.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Device List */}
                    <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                        {devices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full animate-pulse" />
                                    <Search className="w-12 h-12 relative z-10" />
                                </div>
                                <p className="text-sm">Scanning for nearby devices...</p>
                            </div>
                        ) : (
                            devices.map((device) => (
                                <motion.button
                                    key={device.id || device.name} // device.name is often the ID in this system
                                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onSelect(device)}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 hover:border-violet-500 transition-all group text-left relative overflow-hidden"
                                >
                                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-700 shadow-sm text-violet-500 group-hover:scale-110 transition-transform">
                                        {device.type === 'mobile' || device.deviceType === 'PHONE' ? (
                                            <Smartphone className="w-6 h-6" />
                                        ) : (
                                            <Laptop className="w-6 h-6" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-zinc-900 dark:text-white truncate">{device.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="flex h-2 w-2 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                            </span>
                                            <span className="text-xs text-zinc-500 font-medium">Online</span>
                                            {device.ip && <span className="text-[10px] text-zinc-400 ml-auto font-mono">{device.ip}</span>}
                                        </div>
                                    </div>

                                    {/* Selection Ring Effect */}
                                    <div className="absolute inset-0 border-2 border-violet-500 opacity-0 group-hover:opacity-100 rounded-2xl pointer-events-none transition-opacity" />
                                </motion.button>
                            ))
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
