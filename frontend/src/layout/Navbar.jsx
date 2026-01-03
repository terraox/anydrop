import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LayoutGrid, History, Smartphone, CreditCard, Settings, LogOut, Zap, Radar } from 'lucide-react';
import Logo from '../components/ui/Logo';
import ThemeToggle from '../components/ui/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import ShimmerButton from '../components/magicui/ShimmerButton';

const navItems = [
    { icon: LayoutGrid, label: 'Orbit', path: '/' },
    { icon: History, label: 'History', path: '/history' },
    { icon: Smartphone, label: 'Devices', path: '/devices' },
    { icon: CreditCard, label: 'Pricing', path: '/pricing' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();
    const isPro = user?.plan === 'PRO';

    return (
        <>
            <header className="flex h-16 items-center justify-between border-b border-zinc-200/50 bg-white/80 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80 sticky top-0 z-50">
                <Link to="/" className="flex items-center gap-2 hover:scale-105 transition-transform duration-300">
                    <Logo />
                </Link>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 top-16 z-50 flex flex-col bg-zinc-50 dark:bg-zinc-950 p-4"
                    >
                        <nav className="flex-1 space-y-1 overflow-y-auto">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${isActive
                                            ? 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20'
                                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                                            }`}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-auto space-y-4 border-t border-zinc-200 pt-4 dark:border-white/10">
                            {!isPro && (
                                <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-black p-5 text-white shadow-xl ring-1 ring-white/10">
                                    <div className="flex items-center gap-2 mb-2 text-violet-400">
                                        <Zap className="w-4 h-4 fill-current animate-pulse" />
                                        <span className="text-xs font-bold tracking-wider uppercase">Free Plan</span>
                                    </div>
                                    <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
                                        Unlock 10GB transfers.
                                    </p>
                                    <Link to="/checkout" onClick={() => setIsOpen(false)}>
                                        <ShimmerButton className="w-full py-2 text-xs font-bold text-center" shimmerColor="#8B5CF6">
                                            UPGRADE PRO
                                        </ShimmerButton>
                                    </Link>
                                </div>
                            )}

                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-3">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="Avatar" className="h-10 w-10 rounded-full ring-2 ring-white dark:ring-zinc-800" />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-600 flex items-center justify-center text-sm font-bold text-white">
                                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            {user?.username || 'User'}
                                        </span>
                                        <span className="text-xs text-zinc-500">
                                            {user?.email || 'user@example.com'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsOpen(false);
                                    }}
                                    className="p-2 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
