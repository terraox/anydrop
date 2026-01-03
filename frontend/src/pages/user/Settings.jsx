import React from 'react';
import { User, Mail, Lock, Shield, LogOut, Monitor, Moon, Sun, Laptop } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

export default function Settings() {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();

    const handleLogoutAll = () => {
        toast.error("Terminating all active sessions...");
        setTimeout(() => logout(), 1000);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-12 pb-20">

            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Settings</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Configure your neural interface.</p>
            </div>

            <div className="grid gap-8">

                {/* Profile Section */}
                <section className="space-y-6">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        Profile
                    </h2>

                    <div className="flex items-start gap-8">
                        {/* Glitch Avatar */}
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-violet-500 to-fuchsia-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl overflow-hidden">
                                {user?.avatar ? (
                                    <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    <span>{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
                                )}
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                            </div>
                            {/* Glitch Overlay (Pseudo) */}
                            <div className="absolute inset-0 rounded-2xl bg-violet-500 mix-blend-screen opacity-0 group-hover:animate-pulse group-hover:opacity-30 transition-opacity" />
                            <div className="absolute -bottom-2 -right-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider">
                                EDIT
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 max-w-md">
                            <div className="grid gap-1.5">
                                <label className="text-xs font-semibold uppercase text-zinc-500">Username</label>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 transition-all">
                                    <User className="w-4 h-4 text-zinc-400" />
                                    <input
                                        type="text"
                                        defaultValue={user?.username || "Neon-Fox"}
                                        className="bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-white w-full placeholder:text-zinc-500"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-1.5">
                                <label className="text-xs font-semibold uppercase text-zinc-500">Email</label>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 opacity-70 cursor-not-allowed">
                                    <Mail className="w-4 h-4 text-zinc-400" />
                                    <input
                                        type="email"
                                        defaultValue={user?.email || "user@project-pup.com"}
                                        disabled
                                        className="bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-white w-full disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Appearance */}
                <section className="space-y-6">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        Appearance
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { name: 'light', icon: Sun, label: 'Light' },
                            { name: 'dark', icon: Moon, label: 'Dark' },
                            { name: 'system', icon: Laptop, label: 'System' }
                        ].map((mode) => (
                            <button
                                key={mode.name}
                                onClick={() => setTheme(mode.name)}
                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${theme === mode.name
                                    ? 'border-violet-500 bg-violet-500/5 text-violet-600 dark:text-violet-400'
                                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-500'
                                    }`}
                            >
                                <mode.icon className="w-6 h-6" />
                                <span className="text-sm font-medium">{mode.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="space-y-6">
                    <h2 className="text-lg font-semibold text-red-500 border-b border-red-200 dark:border-red-900/30 pb-2 flex items-center gap-2">
                        <Shield className="w-5 h-5" /> Danger Zone
                    </h2>

                    <div className="p-6 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/10 flex items-center justify-between gap-6">
                        <div>
                            <h3 className="font-semibold text-red-900 dark:text-red-200">Log out all devices</h3>
                            <p className="text-sm text-red-700 dark:text-red-300/70 mt-1">
                                This will terminate active sessions on all other devices (iPhone 15 Pro, iPad Air).
                            </p>
                        </div>
                        <button
                            onClick={handleLogoutAll}
                            className="px-4 py-2 bg-white dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:shake transition-all shadow-sm"
                        >
                            TERMINATE ALL
                        </button>
                    </div>
                </section>

            </div>
        </div>
    );
}
