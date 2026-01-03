import React from 'react';

export default function Logo({ className = "" }) {
  return (
    <div className={`group flex items-center gap-3 perspective-[1000px] ${className}`}>
      {/* 3D Container */}
      <div className="relative flex items-center justify-center w-10 h-10 transition-transform duration-500 ease-out group-hover:rotate-12">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#8B5CF6" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-8 h-8"
        >
          {/* Inner Core: Solid, anchors the design */}
          <circle cx="12" cy="12" r="2" fill="#8B5CF6" stroke="none" />
          
          {/* Middle Ring: Flips on X-Axis (Vertical Flip) */}
          <circle 
            cx="12" cy="12" r="6" 
            className="origin-center transition-transform duration-700 ease-out group-hover:[transform:rotateX(180deg)]" 
          />
          
          {/* Outer Ring: Flips on Y-Axis (Horizontal Flip) */}
          <circle 
            cx="12" cy="12" r="10" 
            className="origin-center transition-transform duration-700 ease-out group-hover:[transform:rotateY(180deg)]" 
          />
        </svg>

        {/* Subtle Violet Glow behind */}
        <div className="absolute inset-0 bg-brand-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>

      {/* Text Label */}
      <span className="text-2xl font-bold tracking-tighter text-zinc-900 dark:text-white">
        Any<span className="text-[#8B5CF6]">Drop</span>
      </span>
    </div>
  );
}