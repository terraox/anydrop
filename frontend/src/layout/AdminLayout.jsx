import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Toaster } from 'sonner';

export default function AdminLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Settings, label: 'System', path: '/admin/system' },
    ];

    return (
        <div className="flex h-screen bg-zinc-950 text-white font-sans selection:bg-violet-500/30">
            <Toaster position="top-right" theme="dark" />

            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 bg-zinc-900/50 backdrop-blur-xl flex flex-col">
                <div className="p-6 flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-violet-500" />
                    <span className="text-xl font-bold tracking-tight">Admin<span className="text-violet-500">Pup</span></span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/admin'} // Only exact match for root admin
                            className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
                            ${isActive
                                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'}
                        `}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout Admin</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950">
                <Outlet />
            </main>
        </div>
    );
}
