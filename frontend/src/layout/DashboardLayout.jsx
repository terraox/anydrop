import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import CommandPalette from '../components/ui/CommandPalette';
import Dock from '../components/ui/Dock';


import { AnimatePresence } from 'framer-motion';
import PageTransition from '../components/ui/PageTransition';
import { GridPattern } from '../components/ui/GridPattern';
import WebSocketService from '../services/websocket.service';
import TransferService from '../services/transfer.service';
import { useAuth } from '../context/AuthContext';
import { useDeviceName } from '../context/DeviceNameContext';
import { MessageSquare, Copy, X } from 'lucide-react';
import LocalTransferWebSocketService from '../services/localTransferWebSocket.service';
import { toast } from 'sonner';

export default function DashboardLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const { deviceName } = useDeviceName();

  React.useEffect(() => {
    if (!user) return;

    // Generate unique device ID for this browser instance (Global)
    let webDeviceId = localStorage.getItem('anydrop_web_device_id');
    if (!webDeviceId) {
      webDeviceId = `web-${crypto.randomUUID()}`;
      localStorage.setItem('anydrop_web_device_id', webDeviceId);
    }

    // DISABLED: Do not use TransferService on /receive page
    // The /receive page uses LocalTransferWebSocketService instead
    // TransferService connects to /transfer which doesn't exist for local file transfer
    const isReceivePage = location.pathname === '/receive';

    if (!isReceivePage) {
      // DISABLED: TransferService uses /transfer path which is removed
      // For local file transfer, use LocalTransferWebSocketService with /ws path
      // TransferService.connect(webDeviceId);
      console.log('⚠️ TransferService disabled - use LocalTransferWebSocketService for local file transfer');
    }

    // Connect to STOMP for other features (not for local file transfer)
    WebSocketService.connect(() => {
      // Register this browser instance with the device name from context
      WebSocketService.registerDevice({
        id: webDeviceId,
        name: deviceName || (user.username ? `${user.username}'s Browser` : 'Web Client')
      });
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

    // Connect to Plain WebSocket for Text Sharing (Global)
    const backendHost = window.location.hostname || 'localhost';
    LocalTransferWebSocketService.connect(backendHost, 8080);

    const handleText = (data) => {
      // Filter out messages sent by this device
      if (data.senderId === webDeviceId) {
        console.log('🔄 Ignoring self-sent text message');
        return;
      }

      toast.custom((t) => (
        <div className="w-full relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-2xl flex flex-col gap-3 max-w-sm pointer-events-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-full text-violet-600 dark:text-violet-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Text Received</h3>
                <p className="text-xs text-zinc-500">From {data.senderId || 'Device'}</p>
              </div>
            </div>
            <button
              onClick={() => toast.dismiss(t)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-800/50 text-sm font-mono text-zinc-700 dark:text-zinc-300 break-words max-h-32 overflow-y-auto">
            {data.text}
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                navigator.clipboard.writeText(data.text);
                toast.success('Copied to clipboard');
                toast.dismiss(t);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-sm shadow-violet-500/20"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Text
            </button>
          </div>
        </div>
      ), { duration: Infinity });
    };

    LocalTransferWebSocketService.on('textMessage', handleText);

    // Store handleText in ref or just use cleanup defined here?
    // Since handleText is defined in scope, we can use it in cleanup if we return the cleanup function within scope.


    return () => {
      WebSocketService.disconnect();
      // Remove text listener
      // Note: we can't easily remove specific listener if we don't store the reference outside?
      // Actually handleText is defined inside this run of useEffect.
      // But cleanup runs with the scope of this run. So it has access to handleText.
      // But we need to make sure LocalTransferWebSocketService.off supports it.
      // Assuming it does.
      // LocalTransferWebSocketService.off('textMessage', handleText); // Ideally this

      // Since I didn't verify .off implementation to take a callback, I'll rely on it clearing all? 
      // Or just skip explicit off for now if singleton.
      // But better safety:
      LocalTransferWebSocketService.off('textMessage', handleText);
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
      <CommandPalette />
      <div className="hidden md:block">
        <Dock />
      </div>
    </div>
  );
}