import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { File, Copy, CheckCircle, XCircle, Globe, Hash, Type } from 'lucide-react';
import { toast } from 'sonner';
import MagicCard from '../../components/magicui/MagicCard';

const TABS = [
  { id: 'files', label: 'File Log' },
  { id: 'clipboard', label: 'Clipboard Wall' }
];

const MOCK_FILES = [
  { id: 1, name: 'Project_Alpha_V2.pdf', size: '2.4 MB', status: 'success', date: '2 min ago', device: 'MacBook Pro' },
  { id: 2, name: 'funny_cat.mp4', size: '15.8 MB', status: 'success', date: '10 min ago', device: 'iPhone 15' },
  { id: 3, name: 'secret_keys.env', size: '4 KB', status: 'failed', date: '1 hour ago', device: 'Linux Server' },
  { id: 4, name: 'presentation_final.pptx', size: '12 MB', status: 'success', date: 'Yesterday', device: 'iPad Air' },
];

const MOCK_CLIPBOARD = [
  { id: 1, type: 'hex', content: '#8B5CF6', label: 'Electric Violet' },
  { id: 2, type: 'link', content: 'https://project-pup.com', label: 'Production URL' },
  { id: 3, type: 'text', content: 'sudo rm -rf / --no-preserve-root', label: 'Dangerous Command' },
  { id: 4, type: 'hex', content: '#10B981', label: 'Emerald Success' },
  { id: 5, type: 'text', content: 'Meeting ID: 884-292-111', label: 'Zoom Link' },
  { id: 6, type: 'link', content: 'https://github.com/users/antigravity', label: 'GitHub Profile' },
];

export default function History() {
  const [activeTab, setActiveTab] = useState('files');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">frequency<span className="text-zinc-400">.log</span></h1>
          <p className="text-zinc-500 dark:text-zinc-400">Recent transmissions and memory dumps.</p>
        </div>

        {/* Segmented Control */}
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-white/10 relative">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-6 py-2 text-sm font-medium z-10 transition-colors duration-200 ${activeTab === tab.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-lg shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">

        {/* VIEW 1: FILE LOG */}
        {activeTab === 'files' && (
          <motion.div
            key="files"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden"
          >
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-200/50 dark:border-white/5 text-xs font-semibold uppercase tracking-wider text-zinc-400 sticky top-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md z-10">
              <div className="col-span-5 md:col-span-4">Filename</div>
              <div className="col-span-3 md:col-span-2">Size</div>
              <div className="hidden md:block col-span-2">Device</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Time</div>
            </div>

            <div className="divide-y divide-zinc-200/50 dark:divide-white/5">
              {MOCK_FILES.map((file) => (
                <div key={file.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/50 dark:hover:bg-white/5 transition-colors group">
                  <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <File className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-zinc-700 dark:text-zinc-200 truncate">{file.name}</span>
                  </div>
                  <div className="col-span-3 md:col-span-2 text-zinc-500 text-sm">{file.size}</div>
                  <div className="hidden md:block col-span-2 text-zinc-500 text-sm">{file.device}</div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${file.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-600 border-red-500/20'
                      }`}>
                      {file.status === 'success' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {file.status === 'success' ? 'Sent' : 'Failed'}
                    </span>
                  </div>
                  <div className="col-span-2 text-right text-zinc-500 text-sm">{file.date}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* VIEW 2: CLIPBOARD WALL */}
        {activeTab === 'clipboard' && (
          <motion.div
            key="clipboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {MOCK_CLIPBOARD.map((item) => (
              <MagicCard
                key={item.id}
                className="group cursor-pointer overflow-hidden border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black"
                onClick={() => copyToClipboard(item.content)}
              >
                {/* Card Content */}
                <div className="p-6 relative z-20 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${item.type === 'hex' ? 'bg-zinc-100 dark:bg-zinc-800' :
                        item.type === 'link' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                      }`}>
                      {item.type === 'hex' && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.content }} />}
                      {item.type === 'link' && <Globe className="w-4 h-4" />}
                      {item.type === 'text' && <Type className="w-4 h-4" />}
                    </div>
                    <Copy className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">{item.label}</p>
                    <p className="font-mono text-sm text-zinc-900 dark:text-zinc-200 break-all">{item.content}</p>
                  </div>

                  {/* Glow Effect for Hex Codes */}
                  {item.type === 'hex' && (
                    <div
                      className="absolute inset-0 opacity-20 blur-3xl pointer-events-none transition-opacity group-hover:opacity-30"
                      style={{ backgroundColor: item.content }}
                    />
                  )}
                </div>
              </MagicCard>
            ))}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}