import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
    LayoutDashboard, Users, HardDrive, CreditCard, Ticket,
    Activity, Settings, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ui/ThemeToggle';
import Logo from '../components/ui/Logo';

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/admin/dashboard' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: HardDrive, label: 'Files', href: '/admin/files' },
    { icon: Settings, label: 'Plans & Config', href: '/admin/plans' },
    { icon: Ticket, label: 'Coupons', href: '/admin/coupons' },
    { icon: CreditCard, label: 'Transactions', href: '/admin/transactions' },
    { icon: Activity, label: 'System Health', href: '/admin/health' },
];

export default function AdminLayout() {
    const location = useLocation();
    const { user, isAuthenticated, logout, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                navigate('/admin');
            } else if (user?.role !== 'ADMIN' && user?.role !== 'ROLE_ADMIN') {
                navigate('/');
            }
        }
    }, [isAuthenticated, user, loading, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/admin');
    };

    if (loading || !user || (user.role !== 'ADMIN' && user.role !== 'ROLE_ADMIN')) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-zinc-500 dark:text-zinc-400">Loading Admin Panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl transition-colors duration-300">
                {/* Brand Header */}
                <div className="flex h-16 items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
                    <Link to="/admin/dashboard" className="flex items-center gap-2 group">
                        <Logo />
                        <span className="text-zinc-400 dark:text-zinc-500 text-[10px] ml-1 tracking-widest font-medium bg-violet-100 dark:bg-violet-500/10 px-2 py-0.5 rounded-full text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20">ADMIN</span>
                    </Link>
                </div>

                {/* Navigation */}
                <div className="flex flex-col gap-1 p-4">
                    {sidebarItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link key={item.href} to={item.href}>
                                <button
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 
                    ${isActive
                                            ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 shadow-sm border border-violet-100 dark:border-violet-500/20'
                                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
                                >
                                    <item.icon className={`h-4 w-4 ${isActive ? 'text-violet-600 dark:text-violet-500' : 'text-zinc-500'}`} />
                                    {item.label}
                                </button>
                            </Link>
                        );
                    })}
                </div>

                {/* Logout Button */}
                <div className="absolute bottom-4 left-4 right-4 space-y-3">
                    <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                {user.email?.substring(0, 2).toUpperCase() || 'AD'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{user.email}</p>
                                <p className="text-[10px] text-zinc-500">Super Admin</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/20 transition-all"
                    >
                        <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="pl-64 w-full flex flex-col min-h-screen">
                {/* Top Header */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-8 transition-colors duration-300">
                    <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-200">
                        {sidebarItems.find(i => i.href === location.pathname)?.label || 'Dashboard'}
                    </h1>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <button
                            onClick={handleLogout}
                            className="p-2 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            title="Sign Out"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-8 space-y-8 overflow-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
