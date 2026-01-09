import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, File, Download, X, Laptop, Shield } from 'lucide-react';
import { toast } from 'sonner';
import WebSocketService from '../../services/websocket.service';
import { useDeviceName } from '../../context/DeviceNameContext';
import GlassCard from '../../components/ui/GlassCard';

export default function Receive() {
    const [incomingTransfer, setIncomingTransfer] = useState(null);
    const [isViable, setIsViable] = useState(true);
    const { deviceName } = useDeviceName();

    React.useEffect(() => {
        document.title = "Receive - AnyDrop";

        // Connect WebSocket
        WebSocketService.connect(() => {
            // Register this device with name from context
            WebSocketService.registerDevice({ name: deviceName || 'This Device' });

            WebSocketService.subscribe('/user/queue/transfers', (request) => {
                setIncomingTransfer(request);
            });
        });

        return () => WebSocketService.disconnect();
    }, [deviceName]);

    const handleAcceptTransfer = () => {
        if (incomingTransfer?.downloadUrl) {
            const link = document.createElement('a');
            link.href = incomingTransfer.downloadUrl;
            link.download = incomingTransfer.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(`Downloading ${incomingTransfer.filename}...`);
        }
        setIncomingTransfer(null);
    };

    const handleRejectTransfer = () => {
        setIncomingTransfer(null);
        toast.info("Transfer rejected");
    };

    return (
        <div className="p-6 h-full w-full flex flex-col items-center justify-center relative overflow-hidden">

            {/* Background Pulse */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
                <div className={`w-[500px] h-[500px] rounded-full bg-violet-500/5 ${isViable ? 'animate-ping' : ''}`} />
                <div className="absolute w-[800px] h-[800px] rounded-full border border-violet-500/10" />
            </div>

            <div className="max-w-2xl w-full z-10 flex flex-col items-center gap-8">

                {/* Status Indicator */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-white dark:bg-zinc-900 border-4 border-zinc-100 dark:border-zinc-800 flex items-center justify-center shadow-2xl">
                            <Wifi className={`w-10 h-10 ${isViable ? 'text-violet-500 animate-pulse' : 'text-zinc-400'}`} />
                        </div>
                        {isViable && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                            </span>
                        )}
                    </div>

                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Ready to Receive</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                            Your device is visible to other devices on your AnyDrop network. Files sent to you will appear here.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                        <Laptop className="w-4 h-4 text-zinc-500" />
                        <span className="text-sm font-mono font-bold text-zinc-700 dark:text-zinc-300">
                            {deviceName || 'This Device'}
                        </span>
                    </div>
                </div>

                {/* Incoming Request Card */}
                <AnimatePresence>
                    {incomingTransfer ? (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.9 }}
                            className="w-full"
                        >
                            <GlassCard className="p-8 border-violet-500/30 ring-4 ring-violet-500/10">
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="h-20 w-20 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                                        <File className="w-10 h-10 text-violet-600 dark:text-violet-400" />
                                    </div>

                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Incoming Transfer</h3>
                                        <p className="text-lg font-medium text-violet-600 dark:text-violet-400 mb-2">{incomingTransfer.filename}</p>
                                        <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-zinc-500">
                                            <span>{(incomingTransfer.size / 1024 / 1024).toFixed(2)} MB</span>
                                            <span>•</span>
                                            <span>From {incomingTransfer.sender}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 w-full md:w-auto">
                                        <button
                                            onClick={handleRejectTransfer}
                                            className="flex-1 md:flex-none py-3 px-6 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            Decline
                                        </button>
                                        <button
                                            onClick={handleAcceptTransfer}
                                            className="flex-1 md:flex-none py-3 px-8 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            Accept
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full text-center p-10 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl"
                        >
                            <div className="flex flex-col items-center gap-3 text-zinc-400">
                                <Shield className="w-8 h-8 opacity-50" />
                                <p className="text-sm font-medium">Waiting for secure connection...</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
