import React from 'react';
import { motion } from 'framer-motion';
import { File, Download, X, CheckCircle, AlertCircle, Clock, FolderOpen } from 'lucide-react';
import ProgressBar from './ProgressBar';
import GlassCard from '../ui/GlassCard';
import { isElectron } from '../../utils/electron';

/**
 * IncomingFileCard Component
 * Displays an incoming file with progress, status, and actions
 * 
 * @param {Object} file - File object with metadata
 * @param {Function} onAccept - Callback when user accepts file
 * @param {Function} onReject - Callback when user rejects file
 * @param {Function} onDownload - Callback when user downloads file (mobile)
 */
export default function IncomingFileCard({ file, onAccept, onReject, onDownload }) {
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getStatusIcon = () => {
        switch (file.status) {
            case 'waiting':
                return <Clock className="w-5 h-5 text-amber-500" />;
            case 'receiving':
                return <File className="w-5 h-5 text-violet-500 animate-pulse" />;
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'failed':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            default:
                return <File className="w-5 h-5 text-zinc-500" />;
        }
    };

    const getStatusText = () => {
        switch (file.status) {
            case 'waiting':
                return 'Waiting for transfer...';
            case 'receiving':
                return file.progress !== undefined 
                    ? `Receiving... ${file.progress.toFixed(1)}%`
                    : 'Receiving...';
            case 'completed':
                return 'Transfer complete';
            case 'failed':
                return file.error || 'Transfer failed';
            default:
                return 'Ready';
        }
    };

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isElectronEnv = isElectron();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
        >
            <GlassCard className="p-6 border-violet-500/30">
                <div className="flex flex-col gap-4">
                    {/* File Header */}
                    <div className="flex items-start gap-4">
                        <div className="h-16 w-16 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                            {getStatusIcon()}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate">
                                {file.name}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                {formatFileSize(file.size)}
                            </p>
                            {file.senderName && (
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                    From: {file.senderName}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {(file.status === 'receiving' || file.status === 'waiting') && (
                        <div className="space-y-2">
                            <ProgressBar 
                                progress={file.progress || 0}
                                receivedBytes={file.receivedBytes}
                                totalBytes={file.totalBytes}
                                speed={file.speed}
                            />
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                                {getStatusText()}
                            </p>
                        </div>
                    )}

                    {/* Status Message */}
                    {file.status === 'completed' && (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">{getStatusText()}</span>
                        </div>
                    )}

                    {file.status === 'failed' && (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">{getStatusText()}</span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {file.status === 'waiting' && (
                            <>
                                <button
                                    onClick={() => onReject && onReject(file)}
                                    className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Decline
                                </button>
                                <button
                                    onClick={() => onAccept && onAccept(file)}
                                    className="flex-1 py-2.5 px-4 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25"
                                >
                                    <Download className="w-4 h-4" />
                                    Accept
                                </button>
                            </>
                        )}

                        {file.status === 'completed' && (
                            <>
                                {/* Mobile Browser: Show Download Button */}
                                {isMobile && !isElectronEnv && (
                                    <button
                                        onClick={() => onDownload && onDownload(file)}
                                        className="flex-1 py-2.5 px-4 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                )}
                                
                                {/* Electron: Auto-saved, show Open Folder button */}
                                {isElectronEnv && file.savedPath && (
                                    <button
                                        onClick={() => {
                                            if (window.electron && window.electron.showItemInFolder) {
                                                window.electron.showItemInFolder(file.savedPath);
                                            }
                                        }}
                                        className="flex-1 py-2.5 px-4 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25"
                                    >
                                        <FolderOpen className="w-4 h-4" />
                                        Open Folder
                                    </button>
                                )}
                                
                                {/* Desktop Browser: Show Download Button */}
                                {!isMobile && !isElectronEnv && (
                                    <button
                                        onClick={() => onDownload && onDownload(file)}
                                        className="flex-1 py-2.5 px-4 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </GlassCard>
        </motion.div>
    );
}
