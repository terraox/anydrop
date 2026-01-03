import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Toaster } from 'sonner';
import CommandPalette from '../components/ui/CommandPalette';

export default function DashboardLayout() {
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
          <Outlet />
        </main>

      </div>

      {/* Global Toasts */}
      <Toaster position="bottom-right" theme="system" />
      <CommandPalette />
    </div>
  );
}