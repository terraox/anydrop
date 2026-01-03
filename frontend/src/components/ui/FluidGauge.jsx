import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function FluidGauge({ value = 50, max = 100, label = 'Usage', color = '#8B5CF6' }) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    // Calculate height for the wave based on percentage (100% is full, 0% is empty)
    // We invert it because SVG y coordinates go down
    const waveHeight = 100 - percentage;

    return (
        <div className="relative w-full h-64 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col items-center justify-center group">

            {/* Label Overlay */}
            <div className="absolute top-4 left-4 z-20">
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{label}</h3>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{value} <span className="text-sm text-zinc-500 font-normal">/ {max} GB</span></p>
            </div>

            {/* Fluid Container */}
            <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden">
                {/* SVG Wave 1 (Back) */}
                <motion.div
                    animate={{ x: [-100, 0] }}
                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                    className="absolute bottom-0 left-0 right-0 h-full w-[200%] opacity-40"
                    style={{ bottom: `-${waveHeight}%` }}
                >
                    <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-full text-violet-400/50 fill-current">
                        <path d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </motion.div>

                {/* SVG Wave 2 (Front) */}
                <motion.div
                    animate={{ x: [-100, 0] }}
                    transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
                    className="absolute bottom-0 left-0 right-0 h-full w-[200%] opacity-80 mix-blend-overlay"
                    style={{ bottom: `-${waveHeight}%` }}
                >
                    <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-full fill-current" style={{ color }}>
                        <path d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,90.7C672,85,768,107,864,128C960,149,1056,171,1152,165.3C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </motion.div>
            </div>

            {/* Glass Overlay for Depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        </div>
    );
}
