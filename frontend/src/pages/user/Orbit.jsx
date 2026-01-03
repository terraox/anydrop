import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X, Wifi, Plus } from 'lucide-react';
import { toast } from 'sonner';
import Ripple from '../../components/magicui/Ripple';
import FileService from '../../services/file.service';

export default function Orbit() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

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



  // ...

  const processFiles = async (fileList) => {
    const newFiles = Array.from(fileList).map(file => ({
      id: Math.random().toString(36).substr(2, 9), // Temp ID until server responds
      tempId: true, // Marker to replace with real ID
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type.split('/')[1] || 'unknown',
      status: 'uploading',
      progress: 0,
      fileObject: file // Keep reference for upload
    }));

    setFiles(prev => [...prev, ...newFiles]);
    toast.info(`Initiating upload for ${newFiles.length} files...`);

    // Upload each file
    for (const fileData of newFiles) {
      try {
        await FileService.uploadFile(fileData.fileObject, (progress) => {
          setFiles(prev => prev.map(f =>
            f.id === fileData.id ? { ...f, progress } : f
          ));
        })
          .then(response => {
            // Success - Update with real data from server if available, or just mark sent
            setFiles(prev => prev.map(f =>
              f.id === fileData.id ? {
                ...f,
                status: 'sent',
                progress: 100,
                id: response.data?.id || f.id // Use real ID if returned
              } : f
            ));
            toast.success(`${fileData.name} uploaded successfully!`);
          });

      } catch (error) {
        console.error("Upload failed", error);
        setFiles(prev => prev.map(f =>
          f.id === fileData.id ? { ...f, status: 'error' } : f
        ));
        toast.error(`Failed to upload ${fileData.name}`);
      }
    }
  };

  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // --- VISUAL EFFECTS ---
  const portalVariants = {
    idle: { scale: 0.8, opacity: 0 },
    dragging: {
      scale: 1.2,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    },
    dropping: {
      scale: 0.1,
      opacity: 0,
      transition: { duration: 0.3, ease: "backIn" }
    }
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
          <Ripple mainCircleSize={300} numCircles={8} mainCircleOpacity={0.55} />
        </div>

        {/* DRAG ACTIVE: Portal Expansion */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              variants={portalVariants}
              initial="idle"
              animate="dragging"
              exit="dropping"
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
            >
              {/* Outer Horizon */}
              <div className="w-[600px] h-[600px] rounded-full border border-violet-500/30 bg-violet-500/5 animate-spin-slow blur-3xl opacity-50" />

              {/* Event Horizon */}
              <div className="absolute w-[450px] h-[450px] rounded-full border-2 border-dashed border-violet-500/50 animate-reverse-spin" />

              {/* Accretion Disk */}
              <div className="absolute w-[350px] h-[350px] rounded-full border-4 border-violet-500/40 animate-ping opacity-20" />

              {/* Singularity Pull */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.3)_0%,transparent_60%)] animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Core / Upload Button */}
        <motion.button
          onClick={triggerFileInput}
          whileHover={{ scale: 1.05, translateY: -5 }}
          whileTap={{ scale: 0.95, translateY: 0 }}
          className={`
                relative z-20 w-40 h-40 rounded-full flex flex-col items-center justify-center 
                transition-all duration-300 outline-none
                backdrop-blur-xl
                bg-white/40 dark:bg-zinc-900/40
                border-4 border-white/50 dark:border-white/10
                shadow-[20px_20px_60px_rgba(0,0,0,0.1),-20px_-20px_60px_rgba(255,255,255,0.5)]
                dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]
                ${isDragging ? 'ring-4 ring-violet-500/50 shadow-[0_0_80px_rgba(139,92,246,0.8)] scale-110' : ''}
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

        {/* Status Text - HUD Terminal Style */}
        <div className="absolute bottom-12 flex flex-col items-center justify-center z-20 select-none">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-3 px-4 py-2 rounded-full border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm transition-all ${isEditingName ? 'ring-2 ring-violet-500' : ''}`}
          >
            <div className={`w-2 h-2 rounded-full ${isDragging ? 'bg-violet-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />

            {isDragging ? (
              <span className="font-mono text-xs md:text-sm tracking-wider text-zinc-600 dark:text-zinc-300 uppercase font-semibold">
                PORTAL_ACTIVE::READY_FOR_DROP
              </span>
            ) : isEditingName ? (
              <input
                autoFocus
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleKeyDown}
                className="font-mono text-xs md:text-sm tracking-wider text-zinc-900 dark:text-white bg-transparent outline-none uppercase font-semibold text-center min-w-[150px]"
              />
            ) : (
              <span
                onClick={() => setIsEditingName(true)}
                className="font-mono text-xs md:text-sm tracking-wider text-zinc-600 dark:text-zinc-300 uppercase font-semibold cursor-pointer hover:text-violet-500 transition-colors flex items-center gap-2 group"
                title="Click to rename device"
              >
                {deviceName}
                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-zinc-400">✎</span>
              </span>
            )}

          </motion.div>

          <p className="mt-2 text-[10px] md:text-xs text-zinc-400 dark:text-zinc-500 tracking-wide">
            {isDragging ? 'RELEASE TO INITIATE TRANSFER' : 'Upload or Drag File'}
          </p>
        </div>
      </div>

      {/* Floating File Satellites */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <AnimatePresence>
          {files.map((file, index) => {
            // Satellite Logic: Distribute evenly in a circle circle
            const totalFiles = files.length;
            const radius = 320; // Distance from core
            const angleStep = (2 * Math.PI) / (totalFiles || 1);
            const angle = index * angleStep - (Math.PI / 2); // Start from top

            // Convert polar to cartesian
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1, x, y }}
                exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                drag
                dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
                dragElastic={0.05} // Strong gravity pull-back
                whileDrag={{ scale: 1.1, cursor: "grabbing" }}
                className="pointer-events-auto absolute"
                style={{ x: 0, y: 0 }} // Reset default styles, let motion handle transform
              >
                <div className="relative w-48 backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 p-3 rounded-2xl shadow-xl flex flex-col gap-2 group cursor-default hover:scale-105 transition-transform hover:z-50 hover:shadow-violet-500/20">

                  {/* Delete Badge */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:bg-red-500 hover:text-white border-2 border-white dark:border-zinc-950 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                    title="Remove file"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-500">
                      {file.status === 'sent' ? <Wifi className="w-4 h-4 text-emerald-500" /> : <File className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{file.name}</p>
                      <p className="text-[10px] text-zinc-500">{file.size}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${file.progress}%` }}
                      className={`h-full ${file.status === 'sent' ? 'bg-emerald-500' : 'bg-violet-500'}`}
                    />
                  </div>

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