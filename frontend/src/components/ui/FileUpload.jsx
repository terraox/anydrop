import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, X } from 'lucide-react';

export default function FileUpload({
    onFilesSelected,
    accept = { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] },
    maxFiles = 0 // 0 for unlimited
}) {

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            if (onFilesSelected) {
                onFilesSelected(acceptedFiles);
            }
        }
    }, [onFilesSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        // Fix: If maxFiles is 0 (unlimited), do NOT pass it to react-dropzone, as 0 might block everything.
        // Pass undefined instead to allow unlimited.
        maxFiles: maxFiles > 0 ? maxFiles : undefined,
        multiple: true
    });

    return (
        <div className="w-full h-full">
            <motion.div
                {...getRootProps()}
                className={`
          relative h-full min-h-[300px] w-full rounded-2xl border-2 border-dashed transition-all duration-300 
          flex flex-col items-center justify-center cursor-pointer overflow-hidden
          ${isDragActive
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-violet-500/50 bg-white/50 dark:bg-zinc-900/20'
                    }
        `}
                animate={isDragActive ? {
                    scale: [1, 1.01, 1],
                    boxShadow: [
                        '0 0 0 0 rgba(139, 92, 246, 0)',
                        '0 0 0 10px rgba(139, 92, 246, 0.1)',
                        '0 0 0 0 rgba(139, 92, 246, 0)',
                    ],
                } : {}}
                transition={{ duration: 1, repeat: isDragActive ? Infinity : 0 }}
                whileHover={{ scale: 1.005 }}
            >
                <input {...getInputProps()} />

                <AnimatePresence mode="wait">
                    {isDragActive ? (
                        <motion.div
                            key="active"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="flex flex-col items-center"
                        >
                            <div className="p-4 rounded-full bg-violet-100 dark:bg-violet-900/30 mb-4 animate-bounce">
                                <UploadCloud className="h-10 w-10 text-violet-600 dark:text-violet-400" />
                            </div>
                            <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                                Drop files to transfer!
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center text-center p-6 space-y-4"
                        >
                            <motion.div
                                className="p-5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm group-hover:shadow-violet-500/20 transition-all"
                                whileHover={{ rotate: 10, scale: 1.1 }}
                            >
                                <UploadCloud className="h-8 w-8 text-zinc-400 dark:text-zinc-500 group-hover:text-violet-500 transition-colors" />
                            </motion.div>

                            <div className="space-y-1">
                                <span className="text-xl font-bold text-zinc-700 dark:text-zinc-200 block">
                                    Click or Drag Files
                                </span>
                                <span className="text-sm text-zinc-500 dark:text-zinc-400 block">
                                    PDF, Images, Videos, Archives
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
