import React from 'react';
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
  Radar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';
import ShimmerButton from '../components/magicui/ShimmerButton';
import ThemeToggle from '../components/ui/ThemeToggle';

const navItems = [
  { icon: LayoutGrid, label: 'Orbit', path: '/' },
  { icon: History, label: 'History', path: '/history' },
  { icon: Smartphone, label: 'Devices', path: '/devices' },
  { icon: CreditCard, label: 'Pricing', path: '/pricing' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isPro = user?.plan === 'PRO';

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-950/80 backdrop-blur-xl h-screen z-40">

      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-200/50 dark:border-white/5">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
            <Radar className="w-5 h-5 animate-spin-slow" />
            <div className="absolute inset-0 rounded-lg bg-violet-600 blur opacity-40 group-hover:opacity-60 transition-opacity" />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Any<span className="text-violet-500">Drop</span>
          </span>
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-5 text-white shadow-xl ring-1 ring-white/10 group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-violet-500/20 blur-3xl rounded-full group-hover:bg-violet-500/30 transition-colors"></div>

            <div className="flex items-center gap-2 mb-2 text-violet-400">
              <Zap className="w-4 h-4 fill-current animate-pulse" />
              <span className="text-xs font-bold tracking-wider uppercase">Free Plan</span>
            </div>

            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
              Unlock 10GB transfers and Warp Speed.
            </p>

            <Link to="/pricing">
              <ShimmerButton className="w-full py-2 text-xs font-bold text-center" shimmerColor="#8B5CF6">
                UPGRADE PRO
              </ShimmerButton>
            </Link>
          </div>
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