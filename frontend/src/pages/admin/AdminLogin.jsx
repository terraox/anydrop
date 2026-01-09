import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, AlertTriangle, Shield, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from 'next-themes';
import Logo from '../../components/ui/Logo';
import { ShineBorder } from '../../components/magicui/ShineBorder';
import api from '../../services/api';

export default function AdminLogin() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const { login } = useAuth();
    const { theme, setTheme, resolvedTheme } = useTheme();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // --- MOCK ADMIN LOGIN (FOR TESTING) ---
        if (email === "admin@anydrop.com" && password === "admin") {
            setTimeout(() => {
                login("mock-admin-token-123", {
                    email: "admin@anydrop.com",
                    role: "ADMIN",
                    plan: "ADMIN",
                    username: "SystemAdmin",
                    avatar: "https://api.dicebear.com/9.x/bottts/svg?seed=AdminBot"
                });
                navigate('/admin/dashboard');
                setLoading(false);
            }, 800);
            return;
        }
        // --------------------------------------

        try {
            const response = await api.post('/auth/login', { email, password });

            if (response.status === 200 && response.data.token) {
                const { token, email: userEmail, role, plan, username, avatar } = response.data;

                // Check if user is admin
                if (role !== 'ADMIN') {
                    setError("Access denied. This portal is for administrators only.");
                    setLoading(false);
                    return;
                }

                login(token, { email: userEmail, role, plan, username, avatar });
                navigate('/admin/dashboard');
            } else {
                setError("Invalid response from server.");
            }
        } catch (err) {
            if (err.response && err.response.status === 403) {
                setError(err.response.data || "Your account has been suspended.");
            } else if (err.response && err.response.status === 401) {
                setError("Invalid credentials. Please verify your email and password.");
            } else {
                setError("Connection failed. Please check your network and try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center bg-zinc-950 overflow-hidden">
            {/* Theme Toggle */}
            <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="absolute top-6 right-6 z-50 p-2.5 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 shadow-sm hover:scale-105 transition-all text-zinc-400 hover:text-violet-400"
            >
                {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Background Grid */}
            <div className="absolute inset-0 h-full w-full bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[440px] p-4"
            >
                {/* Admin Badge Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-5 shadow-2xl shadow-violet-500/30 ring-4 ring-violet-500/20">
                        <Shield className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Admin Portal</h2>
                    <p className="text-sm text-zinc-400 mt-2">Secure access for system administrators</p>
                </div>

                <div className="relative overflow-hidden rounded-3xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/50 p-8">
                    {/* ShineBorder Effect */}
                    <ShineBorder
                        shineColor={["#8B5CF6", "#A855F7", "#7C3AED"]}
                        borderWidth={2}
                        duration={10}
                    />

                    <div className="relative z-10">
                        <form onSubmit={handleLogin} className="space-y-5">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 text-sm text-red-400 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                                >
                                    <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
                                </motion.div>
                            )}

                            {/* Email Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Admin Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-3 h-5 w-5 text-zinc-500" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="admin@anydrop.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 pl-11 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 text-white placeholder-zinc-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-3 h-5 w-5 text-zinc-500" />
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 pl-11 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 text-white placeholder-zinc-500 transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3.5 text-sm font-semibold text-white transition-all hover:from-violet-500 hover:to-purple-500 disabled:opacity-70 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Authenticating...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Access Dashboard <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 space-y-3">
                    <p className="text-xs text-zinc-600">
                        🔒 This portal is restricted. Unauthorized access attempts are logged.
                    </p>
                    <a href="/login" className="text-xs text-zinc-500 hover:text-violet-400 transition-colors">
                        ← Back to User Login
                    </a>
                </div>
            </motion.div>
        </div>
    );
}
