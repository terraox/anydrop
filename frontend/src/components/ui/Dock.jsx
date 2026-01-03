import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutGrid,
    History,
    Smartphone,
    CreditCard,
    Settings,
    Zap
} from 'lucide-react';
import { Dock as MagicDock, DockIcon } from '../magicui/Dock';

const DOCK_ITEMS = [
    { icon: LayoutGrid, label: 'Orbit', path: '/' },
    { icon: History, label: 'History', path: '/history' },
    { icon: Smartphone, label: 'Devices', path: '/devices' },
    { icon: CreditCard, label: 'Pricing', path: '/pricing' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Dock() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="fixed bottom-8 left-1/2 md:left-[calc(50%+8rem)] -translate-x-1/2 z-50">
            <MagicDock
                direction="middle"
                className="bg-white/70 dark:bg-black/70 border-zinc-200 dark:border-white/10 shadow-2xl rounded-3xl pb-3"
                iconSize={40}
                iconMagnification={80}
                iconDistance={140}
            >
                {DOCK_ITEMS.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <DockIcon key={item.path} onClick={() => navigate(item.path)}>
                            <div className={`
                    w-full h-full flex items-center justify-center rounded-full transition-all duration-200 relative group
                    ${isActive
                                    ? 'bg-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]'
                                    : 'bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/20'
                                }
                `}>
                                <item.icon className="w-5 h-5 pointer-events-none" />

                                {/* Tooltip */}
                                <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-zinc-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                                    {item.label}
                                </span>

                                {/* Active Indicator (Dot) */}
                                {isActive && (
                                    <span className="absolute -bottom-2 w-1 h-1 bg-violet-500 rounded-full" />
                                )}
                            </div>
                        </DockIcon>
                    );
                })}

                {/* Divider */}
                <div className="w-[1px] h-8 bg-zinc-200 dark:bg-white/10 mx-2" />

                {/* Special Item */}
                <DockIcon onClick={() => navigate('/checkout')}>
                    <div className="w-full h-full flex items-center justify-center rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/20 transition-all duration-200 relative group">
                        <Zap className="w-5 h-5" />
                        <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-zinc-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                            Upgrade
                        </span>
                    </div>
                </DockIcon>

            </MagicDock>
        </div>
    );
}
