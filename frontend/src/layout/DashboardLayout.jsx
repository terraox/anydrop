import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Toaster } from 'sonner';
import CommandPalette from '../components/ui/CommandPalette';
import Dock from '../components/ui/Dock';


import { AnimatePresence } from 'framer-motion';
import PageTransition from '../components/ui/PageTransition';
import { GridPattern } from '../components/ui/GridPattern';
import WebSocketService from '../services/websocket.service';
import TransferService from '../services/transfer.service';
import { useAuth } from '../context/AuthContext';
import { useDeviceName } from '../context/DeviceNameContext';
import { toast } from 'sonner';

export default function DashboardLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const { deviceName } = useDeviceName();

  React.useEffect(() => {
    if (user) {
      // DISABLED: Do not use TransferService on /receive page
      // The /receive page uses LocalTransferWebSocketService instead
      // TransferService connects to /transfer which doesn't exist for local file transfer
      const isReceivePage = location.pathname === '/receive';
      
      if (!isReceivePage) {
        // Generate a unique device ID for this browser instance
        let webDeviceId = localStorage.getItem('anydrop_web_device_id');
        if (!webDeviceId) {
          webDeviceId = `web-${crypto.randomUUID()}`;
          localStorage.setItem('anydrop_web_device_id', webDeviceId);
        }

        // DISABLED: TransferService uses /transfer path which is removed
        // For local file transfer, use LocalTransferWebSocketService with /ws path
        // TransferService.connect(webDeviceId);
        console.log('⚠️ TransferService disabled - use LocalTransferWebSocketService for local file transfer');
      }

      // Connect to STOMP for other features (not for local file transfer)
      WebSocketService.connect(() => {
        // Register this browser instance with the device name from context
        WebSocketService.registerDevice({ name: deviceName || (user.username ? `${user.username}'s Browser` : 'Web Client') });

        // Subscribe to incoming transfers (from mobile to web) - legacy feature
        // For local file transfer, use LocalTransferWebSocketService on /receive page
        if (!isReceivePage) {
          WebSocketService.subscribe('/user/queue/transfers', (data) => {
            console.log("📥 Incoming Transfer:", data);

            toast.message(`Incoming File: ${data.filename}`, {
              description: `From: ${data.sender}`,
              action: {
                label: 'Download',
                onClick: () => {
                  window.open(data.downloadUrl, '_blank');
                },
              },
              duration: Infinity, // Stay until clicked or dismissed
            });
          });
        }
      });
    }

    return () => {
      WebSocketService.disconnect();
      // Only disconnect TransferService if it was connected
      // TransferService.disconnect();
    };
  }, [user, deviceName, location.pathname]);
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-violet-500/30 relative">
      {/* Global Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <GridPattern
          className="absolute inset-x-0 -top-14 -z-10 h-[1000px] w-full fill-neutral-50 stroke-neutral-500/20 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
          y={-6}
          width={20}
          height={20}
        />
      </div>

      {/* Sidebar (Desktop) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden z-10">

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
      <CommandPalette />
      <div className="hidden md:block">
        <Dock />
      </div>
    </div>
  );
}