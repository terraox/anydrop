import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Toaster } from 'sonner';
import CommandPalette from '../components/ui/CommandPalette';
import Dock from '../components/ui/Dock';


import { AnimatePresence } from 'framer-motion';
import PageTransition from '../components/ui/PageTransition';

export default function DashboardLayout() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-violet-500/30">

      {/* Sidebar (Desktop) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden">

        {/* Mobile Navbar */}
        <div className="md:hidden sticky top-0 z-50">
          <Navbar />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          <PageTransition key={location.pathname} className="h-full w-full">
            <Outlet />
          </PageTransition>
        </main>

      </div>

      {/* Global Toasts */}
      <Toaster position="bottom-right" theme="system" />
      <Toaster position="bottom-right" theme="system" />
      <CommandPalette />
      <div className="hidden md:block">
        <Dock />
      </div>
    </div>
  );
}