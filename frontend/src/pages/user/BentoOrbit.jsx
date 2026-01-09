import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X, Wifi, Plus, Laptop, Smartphone, Search, Zap, Activity, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import FileService from '../../services/file.service';
import TransferService from '../../services/transfer.service';
import discoveryService from '../../services/discovery.service';
import Logo from '../../components/ui/Logo';
import GlassCard from '../../components/ui/GlassCard';
import FileUpload from '../../components/ui/FileUpload';
import { fireSideCannons } from '../../components/magicui/Confetti';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import DeviceSelectionModal from './DeviceSelectionModal';
import { useDeviceName } from '../../context/DeviceNameContext';
import api from '../../services/api';

export default function BentoOrbit() {
    const [files, setFiles] = useState([]);
    const { playUploadStart, playUploadSuccess, playUploadError } = useSoundEffects();

    // Device Name Logic - Using centralized context
    const { deviceName, updateDeviceName } = useDeviceName();
    const [localDeviceName, setLocalDeviceName] = useState(deviceName);
    const [isEditingName, setIsEditingName] = useState(false);

    // Sync local state when device name changes from context
    React.useEffect(() => {
        setLocalDeviceName(deviceName);
    }, [deviceName]);

    const handleNameSave = async () => {
        setIsEditingName(false);
        try {
            await updateDeviceName(localDeviceName);
            toast.success('Device name updated! It will sync across all pages.');
        } catch (error) {
            console.error('Failed to update device name:', error);
            toast.error(error.message || 'Failed to update device name');
            // Revert on error
            setLocalDeviceName(deviceName);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleNameSave();
    };

    React.useEffect(() => {
        document.title = "AnyDrop";

        // Connect TransferService with device name from context
        if (deviceName) {
            TransferService.connect(deviceName);
        }

        // Subscribe to LAN devices

        TransferService.onProgress = (transferId, progress) => {
            setFiles(prev => prev.map(f =>
                f.id === transferId ? { ...f, progress: Math.round(progress * 100), status: progress >= 1 ? 'sent' : 'uploading' } : f
            ));
        };

        TransferService.onError = (message) => {
            toast.error(`Transfer Issue: ${message}`);
            setFiles(prev => prev.map(f =>
                f.status === 'uploading' ? { ...f, status: 'error' } : f
            ));
        };

        // Handle incoming transfers from other devices (phone -> laptop)
        TransferService.onTransferRequest = (request) => {
            console.log('📥 Incoming file request from phone:', request);
            // Show popup instead of auto-accepting
            setIncomingTransfer({
                transferId: request.transferId,
                fileName: request.fileName,
                size: request.size,
                senderId: request.senderId,
                sender: request.sender || request.senderId || 'Unknown Device',
                fileType: request.mimeType || 'application/octet-stream'
            });
        };

        // Handle completed transfers
        TransferService.onTransferComplete = (transferId, fileName) => {
            toast.success(`File received: ${fileName}`);
        };

        discoveryService.addListener(handleLanUpdate);
        discoveryService.scanNetwork();

        return () => {
            TransferService.disconnect();
            discoveryService.removeListener(handleLanUpdate);
        };
    }, []);

    // Transfer Request State
    const [incomingTransfer, setIncomingTransfer] = useState(null);
    const [wsDevices, setWsDevices] = useState([]);
    const [lanDevices, setLanDevices] = useState([]);

    // Derived state for total unique devices
    // Filter out ourselves and deduplicate
    const nearbyDevices = React.useMemo(() => {
        const normalizedDeviceName = (deviceName || '').trim().toLowerCase();

        const filteredWs = wsDevices.filter(d => (d.name || '').trim().toLowerCase() !== normalizedDeviceName);
        const filteredLan = lanDevices.filter(d => {
            const dName = (d.name || '').trim().toLowerCase();
            const isSelfName = dName === normalizedDeviceName;
            const isSelfIp = typeof window !== 'undefined' && (d.ip === window.location.hostname || d.ip === '127.0.0.1' || d.ip === 'localhost');
            return !isSelfName && !isSelfIp;
        });

        // Combine and deduplicate by name
        const combined = [...filteredWs, ...filteredLan];
        const unique = [];
        const seenNames = new Set();

        combined.forEach(d => {
            if (!seenNames.has(d.name)) {
                seenNames.add(d.name);
                unique.push(d);
            }
        });

        return unique;
    }, [wsDevices, lanDevices, deviceName]);

    const handleAcceptTransfer = async () => {
        if (!incomingTransfer) return;
        
        try {
            // Use File System Access API to let user choose save location
            let fileHandle = null;
            let savePath = null;
            
            if ('showSaveFilePicker' in window) {
                try {
                    fileHandle = await window.showSaveFilePicker({
                        suggestedName: incomingTransfer.fileName,
                        types: [{
                            description: 'File',
                            accept: {
                                [incomingTransfer.fileType || 'application/octet-stream']: [incomingTransfer.fileName.split('.').pop() || '']
                            }
                        }]
                    });
                    savePath = fileHandle.name;
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Error showing save dialog:', err);
                        toast.error('Failed to open save dialog');
                    }
                    // Fall back to default download if user cancels or API not available
                }
            }
            
            // Accept the transfer with file handle if available
            TransferService.acceptTransfer(incomingTransfer.transferId, incomingTransfer.senderId, fileHandle);
            
            toast.success(`Accepting transfer: ${incomingTransfer.fileName}...`);
            setIncomingTransfer(null);
        } catch (error) {
            console.error('Error accepting transfer:', error);
            toast.error('Failed to accept transfer');
        }
    };

    const handleRejectTransfer = () => {
        if (incomingTransfer) {
            TransferService.rejectTransfer(incomingTransfer.transferId, incomingTransfer.senderId);
            toast.info("Transfer rejected");
        }
        setIncomingTransfer(null);
    };



    const processFiles = async (fileList) => {
        const newFiles = Array.from(fileList).map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            tempId: true,
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            type: file.type.split('/')[1] || 'unknown',
            status: 'uploading',
            progress: 0,
            fileObject: file
        }));

        setFiles(prev => [...prev, ...newFiles]);

        // Open device selection modal
        if (newFiles.length > 0) {
            setPendingTransferFiles(newFiles);
            setIsDeviceModalOpen(true);
        }

        toast.info(`Initiating upload for ${newFiles.length} files...`);
        playUploadStart(); // 🔊 Start sound

        // Upload each file in the background (fire and forget for history)
        newFiles.forEach(async (fileData) => {
            try {
                // Background HTTP upload for server-side history
                await FileService.uploadFile(fileData.fileObject);
            } catch (error) {
                console.warn("Background history upload failed", error);
            }
        });
    };

    const removeFile = (id) => {
        setFiles(files.filter(f => f.id !== id));
    };

    // --- TRANSFER LOGIC ---
    const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
    const [pendingTransferFiles, setPendingTransferFiles] = useState([]);
    const [selectedTargetDevice, setSelectedTargetDevice] = useState(null);

    const handleDeviceSelect = (device) => {
        setIsDeviceModalOpen(false);
        setSelectedTargetDevice(device);

        if (pendingTransferFiles.length > 0) {
            toast.success(`Broadcasting to ${device.name}...`);
            pendingTransferFiles.forEach(file => {
                TransferService.enqueueFile(
                    device.id || device.name,
                    file.fileObject,
                    file.id
                );
            });
            // Clear pending after initiating
            setPendingTransferFiles([]);
        }
    };


    return (
        <div className="p-6 pb-32 h-full w-full overflow-y-auto flex flex-col">
            <DeviceSelectionModal
                isOpen={isDeviceModalOpen}
                onClose={() => setIsDeviceModalOpen(false)}
                devices={nearbyDevices}
                onSelect={handleDeviceSelect}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto w-full flex-1">

                {/* Header - Mobile */}
                <div className="md:hidden col-span-1 mb-4">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-sans tracking-tight">Orbit</h1>
                </div>

                {/* --- Card 1: Main Drop Zone (Top Left - Large - Stretched) --- */}
                <GlassCard className="md:col-span-2 md:row-span-1 min-h-[400px] h-full flex flex-col p-6 items-center justify-center">
                    <div className="w-full h-full max-w-2xl flex flex-col items-center justify-center">
                        <FileUpload
                            onFilesSelected={(files) => processFiles(files)}
                            maxFiles={0}
                        />
                    </div>
                </GlassCard>

                {/* --- Right Column Stack (Stretched) --- */}
                <div className="flex flex-col gap-6 h-full">

                    {/* --- Card 2: Identity --- */}
                    <GlassCard hoverEffect={true} className="flex-1 p-8 flex flex-col justify-center gap-4">
                        <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                            <Laptop className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-widest font-mono">This Device</span>
                        </div>

                        <div>
                            {isEditingName ? (
                                <input
                                    autoFocus
                                    value={localDeviceName}
                                    onChange={(e) => setLocalDeviceName(e.target.value)}
                                    onBlur={handleNameSave}
                                    onKeyDown={handleKeyDown}
                                    className="text-2xl font-mono font-bold bg-transparent border-b-2 border-emerald-500 outline-none text-zinc-900 dark:text-white w-full"
                                />
                            ) : (
                                <div
                                    onClick={() => setIsEditingName(true)}
                                    className="text-3xl font-mono font-bold text-zinc-900 dark:text-white cursor-pointer hover:text-emerald-500 transition-colors truncate tracking-tighter"
                                    title="Click to rename"
                                >
                                    {deviceName}
                                </div>
                            )}
                            <div className="flex items-center gap-2 mt-3">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium font-mono">Online & Visible</span>
                            </div>
                        </div>
                    </GlassCard>

                    {/* --- Card 3: Discovery --- */}
                    <GlassCard hoverEffect={true} className="flex-1 p-8 flex flex-col justify-center gap-4">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <div className="flex items-center gap-3">
                                <Wifi className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-widest font-mono">Nearby</span>
                            </div>
                            <Activity className="w-4 h-4 animate-pulse text-blue-500" />
                        </div>

                        <div className="space-y-3">
                            {nearbyDevices.length === 0 ? (
                                <div className="text-center p-4 text-zinc-400 dark:text-zinc-600 text-sm italic">
                                    No devices found
                                </div>
                            ) : (
                                nearbyDevices.map((device, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-bottom-2 fade-in duration-300">
                                        <div className="flex items-center gap-3">
                                            {device.deviceType === 'PHONE' ? <Smartphone className="w-5 h-5 text-violet-500" /> : <Laptop className="w-5 h-5 text-blue-500" />}
                                            <span className="text-base font-semibold text-zinc-700 dark:text-zinc-300">{device.name}</span>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 box-content border-2 border-white dark:border-zinc-800 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    </div>
                                ))
                            )}
                        </div>
                    </GlassCard>

                </div>

                {/* --- Bottom Row: Split into 2 Boxes --- */}

                {/* Box 1: Transfers (Active Files) - Spans 2 cols */}
                <GlassCard className="md:col-span-2 min-h-[300px] flex flex-col">
                    <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 tracking-tight">
                            <Zap className="w-5 h-5 text-zinc-400" />
                            Transfers
                        </h3>
                        <span className="text-xs font-mono px-2 py-1 rounded-md bg-zinc-100 dark:bg-white/5 text-zinc-500 font-bold">{files.length} ACTIVE</span>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        {files.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/20 rounded-xl border-dashed border-zinc-100 dark:border-zinc-800/50">
                                <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center mb-3 shadow-sm">
                                    <Upload className="w-6 h-6 opacity-30" />
                                </div>
                                <p className="text-sm font-medium">Ready to transfer.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AnimatePresence>
                                    {files.map(file => (
                                        <motion.div
                                            key={file.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="group relative flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-violet-500/50 bg-white dark:bg-zinc-800 transition-all shadow-sm"
                                        >
                                            <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-violet-600 dark:text-violet-500">
                                                {file.status === 'sent' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <File className="w-5 h-5" />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate w-full">{file.name}</h4>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                                                        className={`absolute top-2 right-2 p-1.5 rounded-full border-2 border-white dark:border-zinc-900 transition-all shadow-md ${file.status === 'uploading'
                                                            ? 'bg-red-500 text-white opacity-100'
                                                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100'
                                                            }`}
                                                        title={file.status === 'uploading' ? 'Cancel upload' : 'Remove file'}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-[10px] text-zinc-500 font-medium">{file.size}</span>
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${file.status === 'sent' ? 'text-emerald-500' : 'text-violet-500'}`}>
                                                        {file.status}
                                                    </span>
                                                </div>

                                                {file.status === 'uploading' && (
                                                    <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-700 rounded-full mt-2 overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-violet-500"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${file.progress}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* Box 2: History (Log) - Spans 1 col */}
                <GlassCard className="md:col-span-1 min-h-[300px] flex flex-col">
                    <div className="p-6 border-b border-zinc-100 dark:border-white/5">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 tracking-tight">
                            <Clock className="w-5 h-5 text-zinc-400" />
                            History
                        </h3>
                    </div>

                    <div className="flex-1 p-0 overflow-y-auto">
                        <div className="divide-y divide-zinc-100 dark:divide-white/5">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-default">
                                    <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 font-sans">Received "Design_V2.fig"</p>
                                        <p className="text-[10px] text-zinc-400 font-mono">From Nearby Device • 2 mins ago</p>
                                    </div>
                                </div>
                            ))}
                            <div className="p-4 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-default">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 font-sans">Sent "HolidayOP.jpg"</p>
                                    <p className="text-[10px] text-zinc-400 font-mono">To Nearby Device • 1 hour ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>

            </div>
            {/* --- INCOMING TRANSFER DIALOG (Glassmorphic) --- */}
            <AnimatePresence>
                {incomingTransfer && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center pb-10 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="pointer-events-auto p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 shadow-2xl flex flex-col gap-4 w-80"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center animate-pulse">
                                    <File className="w-6 h-6 text-violet-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900 dark:text-white">Incoming File</h3>
                                    <p className="text-xs text-zinc-500">from {incomingTransfer.sender || incomingTransfer.senderId || 'Unknown Device'}</p>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50">
                                <p className="text-sm font-semibold truncate text-zinc-800 dark:text-zinc-200">{incomingTransfer.fileName}</p>
                                <p className="text-xs text-zinc-500 mt-1">
                                    {(incomingTransfer.size / 1024 / 1024).toFixed(2)} MB • {incomingTransfer.fileType?.split('/')[1] || 'File'}
                                </p>
                            </div>

                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={handleRejectTransfer}
                                    className="flex-1 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Decline
                                </button>
                                <button
                                    onClick={handleAcceptTransfer}
                                    className="flex-1 py-2 rounded-xl bg-violet-500 text-white text-xs font-bold hover:bg-violet-600 transition-colors shadow-lg shadow-violet-500/20"
                                >
                                    Accept
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}
