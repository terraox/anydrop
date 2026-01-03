import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Trophy, Activity, Zap, Star } from 'lucide-react';

export default function IdentityCard({ user }) {
    const ref = useRef(null);

    // Motion values for tilt effect
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

    const handleMouseMove = (e) => {
        const rect = ref.current.getBoundingClientRect();

        // Calculate normalized mouse position (-0.5 to 0.5)
        // -0.5 = left/top, 0.5 = right/bottom
        const width = rect.width;
        const height = rect.height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateY,
                rotateX,
                transformStyle: "preserve-3d",
            }}
            className="relative w-full max-w-md aspect-[1.8/1] rounded-2xl bg-black transition-all ease-out duration-200 perspective-1000 group cursor-none"
        >
            {/* --- Card Content Layer (z-10) --- */}
            <div className="absolute inset-0 rounded-2xl bg-zinc-900/90 border border-white/10 overflow-hidden"
                style={{ transform: "translateZ(50px)" }}>

                {/* Background Mesh/Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/10" />
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                {/* User Info */}
                <div className="absolute top-6 left-6 flex items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-white/20 shadow-lg" style={{ transform: "translateZ(20px)" }}>
                            {user?.avatar ? (
                                <img src={user.avatar} className="w-full h-full object-cover" alt="Avatar" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xl font-bold text-white">
                                    {user?.username?.charAt(0) || 'U'}
                                </div>
                            )}
                        </div>
                        {/* Online Status */}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900 animate-pulse" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            {user?.username || 'Neon Fox'}
                            <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 text-[10px] font-bold border border-yellow-500/30">PRO</span>
                        </h2>
                        <p className="text-zinc-400 text-xs font-mono tracking-widest uppercase">ID: 884-292-111</p>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">

                    <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
                            <Activity className="w-3 h-3" /> Total Moved
                        </span>
                        <span className="text-lg font-bold text-white font-mono">142.8 GB</span>
                    </div>

                    <div className="w-[1px] h-8 bg-white/10" />

                    <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Top Speed
                        </span>
                        <span className="text-lg font-bold text-white font-mono">2.4 GB/s</span>
                    </div>

                    <div className="w-[1px] h-8 bg-white/10" />

                    <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
                            <Trophy className="w-3 h-3" /> Rank
                        </span>
                        <span className="text-lg font-bold text-violet-400 font-mono">#42</span>
                    </div>

                </div>
            </div>

            {/* --- Holographic Glare Layer (Overlay) --- */}
            <div
                className="absolute inset-0 rounded-2xl pointer-events-none mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.2) 50%, transparent 54%)`,
                    transform: "translateZ(60px)",
                    // We can move the gradient position if we want, but a static angled one works nicely with the tilt
                }}
            />

            {/* Border Glow */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-violet-500/50 via-fuchsia-500/50 to-indigo-500/50 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" style={{ transform: "translateZ(-10px)" }} />

        </motion.div>
    );
}
