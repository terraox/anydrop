import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Laptop, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useDeviceName } from '../../context/DeviceNameContext';
import GlassCard from '../../components/ui/GlassCard';
import IncomingFileCard from '../../components/receive/IncomingFileCard';
import LocalTransferWebSocketService from '../../services/localTransferWebSocket.service';
import { getBackendPort } from '../../utils/backendConfig';

/**
 * Receive Page - AirDrop-style incoming file receiver
 * 
 * Features:
 * - Shows incoming file cards with progress
 * - Handles multiple files in a queue
 * - Mobile browser download support
 * - Electron auto-save support (optional)
 */
export default function Receive() {
    const [incomingFiles, setIncomingFiles] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const { deviceName } = useDeviceName();

    // NOTE: Receiver UI should NOT connect to WebSocket
    // The backend hosts the WebSocket server and broadcasts FILE_METADATA and PROGRESS
    // For now, we'll use HTTP polling or Server-Sent Events instead
    // OR: The receiver UI can connect to its own backend's WebSocket (localhost is OK for same-machine)

    // Get receiver IP - for receiver UI on same machine as backend, use localhost
    // This is the ONLY case where localhost is acceptable (receiver UI to its own backend)
    const getReceiverIp = () => {
        // Receiver UI connects to its own backend (same machine)
        // This is acceptable because it's the receiver connecting to itself
        // For discovered devices, use discovered IP from mDNS
        return 'localhost';
    };

    // Connect to receiver's WebSocket server (receiver UI to its own backend)
    useEffect(() => {
        document.title = "Receive - AnyDrop";

        // IMPORTANT: Receiver UI connects to its own backend's WebSocket server
        // This is the ONLY WebSocket connection the receiver UI makes
        // It connects to localhost because the backend is on the same machine
        const receiverIp = getReceiverIp();
        const receiverPort = getBackendPort();

        console.log('🔌 Receiver UI connecting to its own backend WebSocket:', `ws://${receiverIp}:${receiverPort}/ws`);

        // Track reconnect attempts
        let reconnectTimeout = null;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 10;
        const baseReconnectDelay = 2000;

        const attemptConnect = () => {
            try {
                LocalTransferWebSocketService.connect(receiverIp, receiverPort);
            } catch (error) {
                console.error('❌ Failed to connect WebSocket:', error);
                setIsConnected(false);
                scheduleReconnect();
            }
        };

        const scheduleReconnect = () => {
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                const delay = baseReconnectDelay * Math.min(reconnectAttempts, 5);
                console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttempts})`);
                reconnectTimeout = setTimeout(attemptConnect, delay);
            }
        };

        attemptConnect();

        // Listen for connection events
        const handleConnected = () => {
            console.log('✅ Connected to receiver WebSocket');
            setIsConnected(true);
        };

        const handleDisconnected = () => {
            console.log('🔌 Disconnected from receiver WebSocket');
            setIsConnected(false);
            // Try to reconnect
            scheduleReconnect();
        };

        const handleReady = (data) => {
            console.log('✅ READY handshake received');
            setIsConnected(true);
            reconnectAttempts = 0; // Reset reconnect counter on successful connection
        };

        // Listen for FILE_METADATA (incoming file announcement)
        const handleFileMetadata = (data) => {
            console.log('📥 FILE_METADATA received:', data);

            // Filter out files sent by this device (if senderId matches our ID)
            const webDeviceId = localStorage.getItem('anydrop_web_device_id');
            if (data.senderId === webDeviceId) {
                console.log('🔄 Ignoring self-sent file metadata');
                return;
            }

            const files = data.files || [];
            const newFiles = files.map((file, index) => ({
                transferId: data.transferId,
                name: file.name,
                size: file.size,
                senderId: data.senderId,
                senderName: data.senderName || data.senderId || 'Unknown Device',
                status: 'waiting', // waiting, receiving, completed, failed
                progress: 0,
                receivedBytes: 0,
                totalBytes: file.size,
                speed: 0,
                downloadUrl: null,
                savedPath: null,
                error: null
            }));

            setIncomingFiles(prev => {
                // Add new files, avoiding duplicates by transferId + name
                const existing = new Set(prev.map(f => `${f.transferId}-${f.name}`));
                const unique = newFiles.filter(f => !existing.has(`${f.transferId}-${f.name}`));
                return [...prev, ...unique];
            });

            toast.info(`${files.length} file(s) incoming from ${data.senderName || 'Unknown Device'}`);
        };

        // Listen for PROGRESS updates
        const handleProgress = (data) => {
            console.log('📊 PROGRESS update:', data);

            setIncomingFiles(prev => prev.map(file => {
                if (file.transferId === data.transferId && file.name === data.file) {
                    const speed = data.speed || 0;
                    return {
                        ...file,
                        status: 'receiving',
                        progress: data.percentage || ((data.receivedBytes / data.totalBytes) * 100),
                        receivedBytes: data.receivedBytes,
                        totalBytes: data.totalBytes,
                        speed: speed
                    };
                }
                return file;
            }));
        };

        // Listen for TRANSFER_COMPLETE
        const handleTransferComplete = (data) => {
            console.log('✅ TRANSFER_COMPLETE:', data);

            setIncomingFiles(prev => prev.map(file => {
                if (file.transferId === data.transferId && file.name === data.file) {
                    return {
                        ...file,
                        status: 'completed',
                        progress: 100,
                        receivedBytes: data.size,
                        totalBytes: data.size,
                        downloadUrl: data.downloadUrl,
                        savedAs: data.savedAs
                    };
                }
                return file;
            }));

            toast.success(`File received: ${data.file}`);
        };

        // Listen for TRANSFER_ERROR
        const handleTransferError = (data) => {
            console.error('❌ TRANSFER_ERROR:', data);

            setIncomingFiles(prev => prev.map(file => {
                if (file.transferId === data.transferId && file.name === data.file) {
                    return {
                        ...file,
                        status: 'failed',
                        error: data.error || 'Transfer failed'
                    };
                }
                return file;
            }));

            toast.error(`Transfer failed: ${data.error || 'Unknown error'}`);
        };

        // Handle WebSocket errors
        const handleError = (error) => {
            console.error('❌ WebSocket error:', error);
            setIsConnected(false);
        };

        // Register event listeners
        LocalTransferWebSocketService.on('connected', handleConnected);
        LocalTransferWebSocketService.on('disconnected', handleDisconnected);
        LocalTransferWebSocketService.on('ready', handleReady);
        LocalTransferWebSocketService.on('fileMetadata', handleFileMetadata);
        LocalTransferWebSocketService.on('progress', handleProgress);
        LocalTransferWebSocketService.on('transferComplete', handleTransferComplete);
        LocalTransferWebSocketService.on('error', handleError);
        LocalTransferWebSocketService.on('transferError', handleTransferError);

        // Cleanup on unmount
        return () => {
            // Clear reconnect timer
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }

            LocalTransferWebSocketService.off('connected', handleConnected);
            LocalTransferWebSocketService.off('disconnected', handleDisconnected);
            LocalTransferWebSocketService.off('ready', handleReady);
            LocalTransferWebSocketService.off('fileMetadata', handleFileMetadata);
            LocalTransferWebSocketService.off('progress', handleProgress);
            LocalTransferWebSocketService.off('transferComplete', handleTransferComplete);
            LocalTransferWebSocketService.off('error', handleError);
            LocalTransferWebSocketService.off('transferError', handleTransferError);
            // Don't disconnect - keep connection alive for receiving files
            // LocalTransferWebSocketService.disconnect();
        };
    }, [deviceName]);

    // Handle file acceptance
    const handleAcceptFile = useCallback((file) => {
        console.log('✅ Accepting file:', file.name);

        // Send ACCEPT message via WebSocket to trigger sender's HTTP upload
        LocalTransferWebSocketService.send({
            type: 'ACCEPT',
            transferId: file.transferId
        });

        // Update UI to show receiving state
        setIncomingFiles(prev => prev.map(f =>
            f.transferId === file.transferId && f.name === file.name
                ? { ...f, status: 'receiving' }
                : f
        ));

        toast.info(`Accepting ${file.name}...`);
    }, []);

    // Handle file rejection
    const handleRejectFile = useCallback((file) => {
        console.log('❌ Rejecting file:', file.name);

        // Send REJECT message via WebSocket
        LocalTransferWebSocketService.send({
            type: 'REJECT',
            transferId: file.transferId
        });

        // Remove from queue
        setIncomingFiles(prev => prev.filter(f =>
            !(f.transferId === file.transferId && f.name === file.name)
        ));

        toast.info(`Rejected: ${file.name}`);
    }, []);

    // Handle file download (mobile browsers)
    const handleDownloadFile = useCallback((file) => {
        if (!file.downloadUrl) {
            toast.error('Download URL not available');
            return;
        }

        const backendPort = getBackendPort();
        const downloadUrl = `http://localhost:${backendPort}${file.downloadUrl}`;

        console.log('📥 Downloading file:', downloadUrl);

        // Trigger download via user action (required for mobile browsers)
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.name;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Downloading ${file.name}...`);
    }, []);

    // Clean up completed files after 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setIncomingFiles(prev => prev.filter(file => {
                // Keep files that are not completed or failed, or completed less than 5 seconds ago
                if (file.status === 'completed' || file.status === 'failed') {
                    const completedTime = file.completedAt || Date.now();
                    return Date.now() - completedTime < 5000;
                }
                return true;
            }));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6 h-full w-full flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background - Animated pulsing rings when connected */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
                {/* Inner pulsing ring */}
                <motion.div
                    className={`w-[400px] h-[400px] rounded-full ${isConnected ? 'bg-violet-500/10' : 'bg-zinc-500/5'}`}
                    animate={isConnected ? {
                        scale: [1, 1.05, 1],
                        opacity: [0.1, 0.2, 0.1]
                    } : {}}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                {/* Middle ring with pulse */}
                <motion.div
                    className={`absolute w-[600px] h-[600px] rounded-full border ${isConnected ? 'border-violet-500/30' : 'border-zinc-500/10'}`}
                    animate={isConnected ? {
                        scale: [1, 1.02, 1],
                        opacity: [0.3, 0.5, 0.3]
                    } : {}}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                    }}
                />
                {/* Outer ring with slower pulse */}
                <motion.div
                    className={`absolute w-[800px] h-[800px] rounded-full border ${isConnected ? 'border-violet-500/20' : 'border-zinc-500/5'}`}
                    animate={isConnected ? {
                        scale: [1, 1.01, 1],
                        opacity: [0.2, 0.3, 0.2]
                    } : {}}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                />
            </div>

            <div className="max-w-4xl w-full z-10 flex flex-col items-center gap-8">
                {/* Status Indicator with animation */}
                <motion.div
                    className="flex flex-col items-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="relative">
                        <motion.div
                            className={`w-24 h-24 rounded-full bg-white dark:bg-zinc-900 border-4 flex items-center justify-center shadow-2xl ${isConnected ? 'border-violet-500/50 shadow-violet-500/30' : 'border-zinc-100 dark:border-zinc-800'}`}
                            animate={isConnected ? {
                                boxShadow: [
                                    '0 25px 50px -12px rgba(139, 92, 246, 0.15)',
                                    '0 25px 50px -12px rgba(139, 92, 246, 0.35)',
                                    '0 25px 50px -12px rgba(139, 92, 246, 0.15)'
                                ]
                            } : {}}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <Wifi className={`w-10 h-10 ${isConnected ? 'text-violet-500' : 'text-zinc-400'}`} />
                        </motion.div>
                        {isConnected && (
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
                        {!isConnected && (
                            <motion.p
                                className="text-xs text-amber-500 dark:text-amber-400 mt-2"
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                ⚠️ Connecting to transfer service...
                            </motion.p>
                        )}
                    </div>

                    <motion.div
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
                        whileHover={{ scale: 1.02 }}
                    >
                        <Laptop className="w-4 h-4 text-zinc-500" />
                        <span className="text-sm font-mono font-bold text-zinc-700 dark:text-zinc-300">
                            {deviceName || 'This Device'}
                        </span>
                    </motion.div>
                </motion.div>

                {/* Incoming Files Queue */}
                <div className="w-full space-y-4 max-h-[60vh] overflow-y-auto">
                    <AnimatePresence mode="popLayout">
                        {incomingFiles.length > 0 ? (
                            incomingFiles.map((file, index) => (
                                <IncomingFileCard
                                    key={`${file.transferId}-${file.name}-${index}`}
                                    file={file}
                                    onAccept={handleAcceptFile}
                                    onReject={handleRejectFile}
                                    onDownload={handleDownloadFile}
                                />
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full text-center p-10 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl"
                            >
                                <div className="flex flex-col items-center gap-3 text-zinc-400">
                                    <Shield className="w-8 h-8 opacity-50" />
                                    <p className="text-sm font-medium">Waiting for incoming files...</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
