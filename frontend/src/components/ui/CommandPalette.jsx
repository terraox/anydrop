import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '../../context/AuthContext';
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    User,
    LayoutDashboard,
    History,
    Smartphone,
    LogOut,
    Sun,
    Moon,
    Laptop,
    Search,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { setTheme } = useTheme();
    const { logout, user } = useAuth();

    // Toggle with Cmd+K
    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = (command) => {
        setOpen(false);
        command();
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 pointer-events-none">

                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                        className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Command Menu */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        drag
                        dragConstraints={{ left: -300, right: 300, top: -200, bottom: 200 }}
                        dragElastic={0.05}
                        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-2xl backdrop-blur-xl pointer-events-auto cursor-grab active:cursor-grabbing"
                    >
                        <Command className="w-full">
                            {/* Search Input */}
                            <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-3">
                                <Search className="mr-2 h-5 w-5 shrink-0 opacity-50 text-zinc-500" />
                                <Command.Input
                                    autoFocus
                                    placeholder="Type a command or search..."
                                    className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <div className="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                                    ESC
                                </div>
                            </div>

                            {/* Results List */}
                            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2 scroll-py-2">
                                <Command.Empty className="py-6 text-center text-sm text-zinc-500">
                                    No results found.
                                </Command.Empty>

                                <Command.Group heading="Navigation" className="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-2 py-1.5 mb-2">
                                    <Command.Item
                                        value="orbit dashboard home"
                                        onSelect={() => runCommand(() => navigate('/'))}
                                        className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-700 dark:text-zinc-300 aria-selected:bg-violet-500 aria-selected:text-white cursor-pointer transition-colors"
                                    >
                                        <LayoutDashboard className="h-4 w-4 text-zinc-500 group-aria-selected:text-white" />
                                        <span>Orbit Dashboard</span>
                                    </Command.Item>
                                    <Command.Item
                                        value="transfer history"
                                        onSelect={() => runCommand(() => navigate('/history'))}
                                        className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-700 dark:text-zinc-300 aria-selected:bg-violet-500 aria-selected:text-white cursor-pointer transition-colors"
                                    >
                                        <History className="h-4 w-4 text-zinc-500 group-aria-selected:text-white" />
                                        <span>Transfer History</span>
                                    </Command.Item>
                                    <Command.Item
                                        value="connected devices"
                                        onSelect={() => runCommand(() => navigate('/devices'))}
                                        className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-700 dark:text-zinc-300 aria-selected:bg-violet-500 aria-selected:text-white cursor-pointer transition-colors"
                                    >
                                        <Smartphone className="h-4 w-4 text-zinc-500 group-aria-selected:text-white" />
                                        <span>Connected Devices</span>
                                    </Command.Item>
                                    <Command.Item
                                        value="billing plans pricing"
                                        onSelect={() => runCommand(() => navigate('/pricing'))}
                                        className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-700 dark:text-zinc-300 aria-selected:bg-violet-500 aria-selected:text-white cursor-pointer transition-colors"
                                    >
                                        <CreditCard className="h-4 w-4 text-zinc-500 group-aria-selected:text-white" />
                                        <span>Billing & Plans</span>
                                    </Command.Item>
                                    <Command.Item
                                        value="settings config"
                                        onSelect={() => runCommand(() => navigate('/settings'))}
                                        className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-700 dark:text-zinc-300 aria-selected:bg-violet-500 aria-selected:text-white cursor-pointer transition-colors"
                                    >
                                        <Settings className="h-4 w-4 text-zinc-500 group-aria-selected:text-white" />
                                        <span>Settings</span>
                                    </Command.Item>
                                </Command.Group>

                                <Command.Group heading="Appearance" className="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-2 py-1.5 mb-2 border-t border-zinc-100 dark:border-zinc-800/50">
                                    <Command.Item
                                        value="light mode theme"
                                        onSelect={() => runCommand(() => setTheme('light'))}
                                        className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-700 dark:text-zinc-300 aria-selected:bg-violet-500 aria-selected:text-white cursor-pointer transition-colors"
                                    >
                                        <Sun className="h-4 w-4 text-zinc-500 group-aria-selected:text-white" />
                                        <span>Light Mode</span>
                                    </Command.Item>
                                    <Command.Item
                                        value="dark mode theme"
                                        onSelect={() => runCommand(() => setTheme('dark'))}
                                        className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-700 dark:text-zinc-300 aria-selected:bg-violet-500 aria-selected:text-white cursor-pointer transition-colors"
                                    >
                                        <Moon className="h-4 w-4 text-zinc-500 group-aria-selected:text-white" />
                                        <span>Dark Mode</span>
                                    </Command.Item>
                                    <Command.Item
                                        value="system mode theme"
                                        onSelect={() => runCommand(() => setTheme('system'))}
                                        className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-700 dark:text-zinc-300 aria-selected:bg-violet-500 aria-selected:text-white cursor-pointer transition-colors"
                                    >
                                        <Laptop className="h-4 w-4 text-zinc-500 group-aria-selected:text-white" />
                                        <span>System Theme</span>
                                    </Command.Item>
                                </Command.Group>

                                <Command.Group heading="Account" className="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-2 py-1.5 mb-2 border-t border-zinc-100 dark:border-zinc-800/50">
                                    <Command.Item
                                        disabled
                                        value="plan free"
                                        className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-400 dark:text-zinc-600 bg-zinc-50 dark:bg-zinc-900/50 cursor-not-allowed mb-1"
                                    >
                                        <Zap className="h-4 w-4" />
                                        <span>Plan: {user?.plan || 'Free'}</span>
                                    </Command.Item>
                                    <Command.Item
                                        value="logout sign out"
                                        onSelect={() => runCommand(() => logout())}
                                        className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-600 aria-selected:bg-red-500 aria-selected:text-white cursor-pointer transition-colors"
                                    >
                                        <LogOut className="h-4 w-4 text-red-500 group-aria-selected:text-white" />
                                        <span>Log Out</span>
                                    </Command.Item>
                                </Command.Group>
                            </Command.List>

                            <div className="border-t border-zinc-200 dark:border-zinc-800 px-3 py-2">
                                <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-wider font-medium">
                                    <span>AnyDrop Command</span>
                                    <span>v1.0.0</span>
                                </div>
                            </div>
                        </Command>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
