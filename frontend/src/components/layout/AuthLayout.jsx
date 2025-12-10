import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Send, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function AuthLayout({ children, title, subtitle }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-black overflow-hidden transition-colors duration-300">
      {/* Theme Toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="absolute top-6 right-6 z-50 p-2 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 shadow-sm hover:scale-105 transition-all text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* Luxurious Background Pattern [cite: 166] */}
      <div className="absolute inset-0 h-full w-full bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] pointer-events-none" />

      {/* Animated Gradient Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[420px] p-4"
      >
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-2 hover:scale-105 transition-transform group">
            <Send className="h-7 w-7 text-indigo-600 dark:text-indigo-400 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
            <span className="text-3xl font-bold tracking-tighter text-zinc-900 dark:text-white">
              Any<span className="text-indigo-600 dark:text-indigo-400">Drop</span>
            </span>
          </Link>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">{subtitle}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] p-8 ring-1 ring-zinc-900/5 dark:ring-zinc-100/10">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}