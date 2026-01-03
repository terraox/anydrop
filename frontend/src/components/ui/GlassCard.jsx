import React from 'react';

export default function GlassCard({ children, className = "", hoverEffect = false, ...props }) {
    return (
        <div
            className={`
        relative overflow-hidden rounded-3xl border 
        bg-white/60 dark:bg-[#050505]/60 
        backdrop-blur-2xl 
        border-black/10 dark:border-white/10
        shadow-sm dark:shadow-none
        transition-all duration-500 ease-out
        ${hoverEffect ? 'group hover:scale-[1.01] hover:bg-white/80 dark:hover:bg-white/5 hover:border-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/10' : ''}
        ${className}
      `}
            {...props}
        >
            {/* Optional: Subtle inner glow/gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/20 dark:to-white/5 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
}
