import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X, Wifi, Plus } from 'lucide-react';
import { toast } from 'sonner';
import Ripple from '../../components/magicui/Ripple';

export default function Orbit() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e) => {
    processFiles(e.target.files);
  };

  const processFiles = (fileList) => {
    const droppedFiles = Array.from(fileList).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type.split('/')[1] || 'unknown',
      status: 'sending'
    }));

    setFiles(prev => [...prev, ...droppedFiles]);
    toast.success(`${droppedFiles.length} files entered orbit`);

    // Simulate transfer completion
    setTimeout(() => {
      setFiles(prev => prev.map(f => ({ ...f, status: 'sent' })));
    }, 3000);
  };

  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="relative h-full w-full flex items-center justify-center min-h-[80vh] overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.05)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1)_0%,transparent_70%)]" />
      </div>

      {/* --- Central Interactive Radar --- */}
      <div className="relative z-10 flex flex-col items-center justify-center group w-full h-full">

        {/* --- Ripples (Always Active) --- */}
        <div className="absolute inset-0 flex items-center justify-center -z-10 overflow-hidden pointer-events-none">
          <Ripple mainCircleSize={300} numCircles={6} />
        </div>

        {/* DRAG ACTIVE: Portal Expansion */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-[500px] h-[500px] rounded-full border-2 border-dashed border-violet-500/50 bg-violet-500/5 animate-spin-slow" />
              <div className="absolute w-[350px] h-[350px] rounded-full border-4 border-violet-500/30 animate-ping" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Core / Upload Button */}
        <motion.button
          onClick={triggerFileInput}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
                relative z-20 w-40 h-40 rounded-full flex flex-col items-center justify-center 
                backdrop-blur-xl transition-all duration-300 border-4 cursor-pointer outline-none
                ${isDragging
              ? 'bg-violet-500/20 border-violet-500 shadow-[0_0_80px_rgba(139,92,246,0.4)]'
              : 'bg-white/40 dark:bg-zinc-900/40 border-white/50 dark:border-white/10 hover:border-violet-500/50 dark:hover:border-violet-500/50 hover:bg-white/60 dark:hover:bg-zinc-800/60 shadow-lg dark:shadow-none'
            }
            `}
        >
          <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${isDragging ? 'bg-violet-500/10 animate-pulse' : 'bg-transparent'}`} />

          {isDragging ? (
            <Upload className="w-10 h-10 text-violet-500 mb-2 animate-bounce" />
          ) : (
            <Plus className="w-10 h-10 text-zinc-400 dark:text-zinc-500 group-hover:text-violet-500 transition-colors" />
          )}

          <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${isDragging ? 'text-violet-500' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-violet-500'}`}>
            {isDragging ? 'Drop' : 'Upload'}
          </span>
        </motion.button>

        {/* Status Text */}
        {/* Status Text */}
        <div className="absolute top-[60%] text-center pointer-events-none select-none z-20">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white transition-colors">
            {isDragging ? 'Portal Active' : 'Scanning Orbit...'}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {isDragging ? 'Release to beam files' : 'Drop files here or click core to upload'}
          </p>
        </div>
      </div>

      {/* Floating File Cards */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence>
          {files.map((file, index) => {
            // Random position scatter
            const randomX = (index % 2 === 0 ? 1 : -1) * (200 + (index * 60));
            const randomY = (index % 3 === 0 ? 1 : -1) * (80 + (index * 40));

            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1, x: randomX, y: randomY }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                drag
                dragConstraints={{ left: -400, right: 400, top: -300, bottom: 300 }}
                whileHover={{ scale: 1.05, zIndex: 50 }}
                className="pointer-events-auto absolute left-1/2 top-1/2 -ml-32 -mt-10"
              >
                <div className="w-64 backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 p-4 rounded-2xl shadow-xl flex items-center gap-4 group cursor-grab active:cursor-grabbing hover:shadow-2xl transition-shadow">
                  <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-500">
                    <File className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{file.name}</p>
                    <p className="text-xs text-zinc-500 flex items-center gap-2">
                      {file.size} • <span className={file.status === 'sent' ? 'text-emerald-500 font-medium' : 'text-violet-500 font-medium'}>{file.status === 'sent' ? 'Sent' : 'Uploading...'}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Device Radar Blips */}
      <div className="absolute top-10 right-10 p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <Wifi className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-zinc-900 dark:text-white">3 Devices Near</p>
            <p className="text-xs text-zinc-500">Ready to receive</p>
          </div>
        </div>
      </div>

    </div>
  );
}