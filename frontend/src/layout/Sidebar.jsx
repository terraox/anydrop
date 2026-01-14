import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  History,
  Smartphone,
  CreditCard,
  Settings,
  LogOut,
  Zap,
  Radar,
  ShieldCheck,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';
import ShimmerButton from '../components/magicui/ShimmerButton';
import ThemeToggle from '../components/ui/ThemeToggle';
import { useTheme } from 'next-themes';
import api from '../services/api';

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, resolvedTheme } = useTheme();
  const isPro = user?.plan === 'PRO';

  // Dynamic view mode state
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('orbit_view_mode') || 'classic');

  // Transfer status for free users
  const [transferStatus, setTransferStatus] = useState(null);

  useEffect(() => {
    const handleViewChange = () => {
      setViewMode(localStorage.getItem('orbit_view_mode') || 'classic');
    };
    window.addEventListener('orbit-view-change', handleViewChange);
    return () => window.removeEventListener('orbit-view-change', handleViewChange);
  }, []);

  // Fetch transfer status for free users
  useEffect(() => {
    const fetchTransferStatus = async () => {
      if (!isPro && user) {
        try {
          const response = await api.get('/auth/transfer-status');
          setTransferStatus(response.data);
        } catch (error) {
          console.error('Failed to fetch transfer status:', error);
        }
      }
    };

    fetchTransferStatus();
    // Refresh every 10 seconds if user is free
    const interval = !isPro ? setInterval(fetchTransferStatus, 10000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPro, user]);

  // Dynamic nav items based on view mode
  const navItems = [
    {
      icon: viewMode === 'bento' ? LayoutGrid : Radar,
      label: viewMode === 'bento' ? 'Bento' : 'Orbit',
      path: '/'
    },
    { icon: History, label: 'History', path: '/history' },
    { icon: Download, label: 'Receive', path: '/receive' },
    { icon: Smartphone, label: 'Devices', path: '/devices' },
    { icon: CreditCard, label: 'Pricing', path: '/pricing' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  // Determine button background based on theme
  const buttonBackground = resolvedTheme === 'dark'
    ? 'rgba(0, 0, 0, 1)' // Black in dark mode
    : 'rgba(255, 255, 255, 1)'; // White in light mode

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-zinc-200/50 dark:border-white/5 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-2xl h-screen z-40 supports-[backdrop-filter]:bg-white/20">

      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-200/50 dark:border-white/5">
        <Link to="/" className="flex items-center gap-2 group hover:scale-105 transition-transform duration-300">
          <Logo />
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden ${isActive
                ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}
            >
              <item.icon
                className={`h-5 w-5 transition-colors ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                  }`}
              />
              <span className="relative z-10">{item.label}</span>

              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 w-1 h-6 bg-violet-500 rounded-r-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Upgrade Card */}
      <div className="p-4 border-t border-zinc-200/50 dark:border-white/5 space-y-4">

        {!isPro && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-black dark:from-white dark:via-zinc-50 dark:to-zinc-100 p-5 text-white dark:text-zinc-900 shadow-xl ring-1 ring-white/10 dark:ring-black/5 group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-violet-500/20 blur-3xl rounded-full group-hover:bg-violet-500/30 transition-colors"></div>

            <div className="flex items-center gap-2 mb-2 text-violet-400 dark:text-violet-600">
              <Zap className="w-4 h-4 fill-current animate-pulse" />
              <span className="text-xs font-bold tracking-wider uppercase">Free Plan</span>
            </div>

            {/* Transfer Count Display */}
            {transferStatus?.hasLimit && (
              <div className="mb-3 p-2.5 rounded-lg bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-zinc-300 dark:text-zinc-600">Daily Transfers</span>
                  <span className="text-xs font-bold text-white dark:text-zinc-900">
                    {transferStatus.remainingToday}/{transferStatus.dailyLimit}
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 dark:bg-black/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${transferStatus.remainingToday === 0
                        ? 'bg-red-500'
                        : transferStatus.remainingToday <= 1
                          ? 'bg-amber-500'
                          : 'bg-violet-500'
                      }`}
                    style={{
                      width: `${(transferStatus.remainingToday / transferStatus.dailyLimit) * 100}%`
                    }}
                  />
                </div>
              </div>
            )}

            <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-4 leading-relaxed">
              Unlock 10GB transfers and Warp Speed.
            </p>

            <Link to="/checkout">
              <ShimmerButton
                className={`w-full py-2 text-xs font-bold text-center ${resolvedTheme === 'dark' ? 'text-white' : 'text-zinc-900'}`}
                shimmerColor="#8B5CF6"
                background={buttonBackground}
              >
                UPGRADE PRO
              </ShimmerButton>
            </Link>
          </div>
        )}

        {/* Admin Panel Link - Only for Admins */}
        {user?.role === 'ADMIN' && (
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-all group"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Admin Panel</span>
          </Link>
        )}

        {/* User Profile Row */}
        <div className="flex items-center justify-between px-1 pt-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="h-9 w-9 rounded-full ring-2 ring-white dark:ring-zinc-800 shadow-lg bg-zinc-100 dark:bg-zinc-800 object-cover"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white dark:ring-zinc-800 shadow-lg">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-zinc-950 rounded-full" />
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate w-24">
                {user?.username || 'Neon-Fox'}
              </span>
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                Online
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10 dark:hover:text-red-400 transition-colors text-zinc-400"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}