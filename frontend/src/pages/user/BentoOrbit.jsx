import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X, Wifi, Plus, Laptop, Smartphone, Search, Zap, Activity, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import FileService from '../../services/file.service';
import Logo from '../../components/ui/Logo';
import GlassCard from '../../components/ui/GlassCard';
import FileUpload from '../../components/ui/FileUpload';
import { fireSideCannons } from '../../components/magicui/Confetti';
import { useSoundEffects } from '../../hooks/useSoundEffects';

export default function BentoOrbit() {
    const [files, setFiles] = useState([]);
    const { playUploadStart, playUploadSuccess, playUploadError } = useSoundEffects();

    React.useEffect(() => {
        document.title = "AnyDrop";
    }, []);

    // Device Name Logic
    const generateDeviceName = () => {
        const prefixes = ['Orbit', 'Nexus', 'Flux', 'Cyber', 'Titan', 'Aero', 'Prime'];
        const suffixes = ['Alpha', 'Beta', 'Prime', 'X', '9', 'V2', 'Link'];
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]}-${suffixes[Math.floor(Math.random() * suffixes.length)]}-${Math.floor(Math.random() * 100)}`;
    };

    const [deviceName, setDeviceName] = useState(() => localStorage.getItem('anydrop_device_name') || generateDeviceName());
    const [isEditingName, setIsEditingName] = useState(false);

    const handleNameSave = () => {
        setIsEditingName(false);
        localStorage.setItem('anydrop_device_name', deviceName);
        toast.success('Device name updated');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleNameSave();
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
        toast.info(`Initiating upload for ${newFiles.length} files...`);
        playUploadStart(); // 🔊 Start sound

        for (const fileData of newFiles) {
            try {
                await FileService.uploadFile(fileData.fileObject, (progress) => {
                    setFiles(prev => prev.map(f =>
                        f.id === fileData.id ? { ...f, progress } : f
                    ));
                })
                    .then(response => {
                        setFiles(prev => prev.map(f =>
                            f.id === fileData.id ? {
                                ...f,
                                status: 'sent',
                                progress: 100,
                                id: response.data?.id || f.id
                            } : f
                        ));
                        toast.success(`${fileData.name} uploaded successfully!`);
                        fireSideCannons(); // 🎉 Celebration!
                        playUploadSuccess(); // 🔊 Success sound
                    });

            } catch (error) {
                console.error("Upload failed", error);
                setFiles(prev => prev.map(f =>
                    f.id === fileData.id ? { ...f, status: 'error' } : f
                ));
                toast.error(`Failed to upload ${fileData.name}`);
                playUploadError(); // 🔊 Error sound
            }
        }
    };

    const removeFile = (id) => {
        setFiles(files.filter(f => f.id !== id));
    };

    return (
        <div className="p-6 pb-32 h-full w-full overflow-y-auto flex flex-col">
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
                                    value={deviceName}
                                    onChange={(e) => setDeviceName(e.target.value)}
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
                            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <Smartphone className="w-5 h-5 text-violet-500" />
                                    <span className="text-base font-semibold text-zinc-700 dark:text-zinc-300">iPhone 15 Pro</span>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-amber-500 box-content border-2 border-white dark:border-zinc-800" />
                            </div>
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
                                            className="group relative flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-violet-500/50 bg-white dark:bg-zinc-800/40 transition-all shadow-sm"
                                        >
                                            <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-violet-600 dark:text-violet-500">
                                                {file.status === 'sent' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <File className="w-5 h-5" />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate w-full">{file.name}</h4>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                                                        className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-zinc-800 rounded-full shadow-sm"
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
                                        <p className="text-[10px] text-zinc-400 font-mono">From iPad Air • 2 mins ago</p>
                                    </div>
                                </div>
                            ))}
                            <div className="p-4 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-default">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 font-sans">Sent "HolidayOP.jpg"</p>
                                    <p className="text-[10px] text-zinc-400 font-mono">To iPhone 15 Pro • 1 hour ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>

            </div>
        </div >
    );
}
