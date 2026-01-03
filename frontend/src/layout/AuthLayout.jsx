import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import Logo from '../components/ui/Logo';
import ThemeToggle from '../components/ui/ThemeToggle';
import ShineBorder from '../components/magicui/ShineBorder';

export default function AuthLayout({ children, title, subtitle }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-black overflow-hidden transition-colors duration-300">

      {/* --- Animated Theme Toggle --- */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* --- Background Pattern --- */}
      <div className="absolute inset-0 h-full w-full bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] pointer-events-none" />

      {/* --- Electric Violet Blob --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* --- Main Content --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[440px] p-4"
      >
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex justify-center mb-4 hover:scale-105 transition-transform duration-300">
            <Logo />
          </Link>

          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            {subtitle}
          </p>
        </div>

        {/* --- Magic UI Shine Border Wrapper --- */}
        <div className="relative shadow-2xl shadow-black/5 dark:shadow-black/20 rounded-[20px] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl overflow-hidden">

          <ShineBorder
            className="z-10"
            shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
            borderWidth={1.5}
            duration={8}
          />

          <div className="relative z-20 p-8">
            {children}
          </div>

        </div>
      </motion.div>
    </div>
  );
}