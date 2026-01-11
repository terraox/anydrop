import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { sequelize } from './models/index.js';

// Local file transfer modules
import { startAdvertising, stopAdvertising, updateDeviceName, cleanup as cleanupAdvertiser } from './services/mdnsAdvertiser.js';
import mdnsBrowser from './services/mdnsBrowser.js';
import { createFileServerRouter } from './services/fileServer.js';
import deviceManager from './services/deviceManager.js';
import localFileTransferRoutes from './routes/localFileTransfer.js';

dotenv.config();

const app = express();
const server = createServer(app);

// WebSocket server for signaling (NOT for file data - files use HTTP)
// IMPORTANT: Bind to 0.0.0.0 to accept connections from all network interfaces
const wss = new WebSocketServer({
  server,
  path: '/ws',
  perMessageDeflate: false // Disable compression for simplicity
});

// Use port 3000 for local file transfer, but also support 8080 for Flutter app compatibility
// Flutter app's subnet scanner checks port 8080 by default
const PORT = process.env.LOCAL_FILE_TRANSFER_PORT || 8080;

// CORS for local network
app.use(cors({
  origin: true,
  credentials: true
}));

// Broadcast function for progress updates (defined early for use in routers)
// Track all connected clients (both senders and receiver UI)
const connectedClients = new Set();

const broadcastToClients = (message) => {
  const messageStr = JSON.stringify(message);
  connectedClients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      try {
        client.send(messageStr);
      } catch (error) {
        console.error('❌ Error broadcasting to client:', error);
      }
    }
  });
};

// ⚠️ IMPORTANT: Mount file server routes BEFORE express.json()
// This ensures /upload receives raw streaming (application/octet-stream)
// and is NOT parsed by express.json() middleware
app.use('/', createFileServerRouter(broadcastToClients));

// JSON body parsing for other routes (AFTER file server)
// ❌ Do NOT use express.json for /upload - it uses raw streaming
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    device: deviceManager.getDeviceInfo()
  });
});

// Identity endpoint for Flutter app discovery (subnet scanning)
// This is the critical endpoint that mobile app uses to discover desktop devices
app.get('/api/identify', (req, res) => {
  const deviceInfo = deviceManager.getDeviceInfo();
  const deviceId = deviceInfo?.deviceId || 'unknown-device';
  const deviceName = deviceInfo?.deviceName || 'AnyDrop-Desktop';

  console.log('📱 /api/identify called - returning:', { deviceId, deviceName });

  res.json({
    app: 'AnyDrop',
    name: deviceName,
    id: deviceId,
    deviceId: deviceId,
    icon: 'laptop',
    type: 'DESKTOP',
    version: '1.0.0'
  });
});

// Connectivity test endpoint for Flutter app
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Local file transfer server is connected!',
    server: 'localFileTransferServer',
    port: PORT,
    device: deviceManager.getDeviceInfo(),
    timestamp: new Date().toISOString()
  });
});

// File transfer API routes
app.use('/api/transfer', localFileTransferRoutes);

// WebSocket server for signaling (receiver hosts this, sender connects to it)
// File data is NOT sent via WebSocket - only used for signaling and progress updates
// Note: connectedClients is defined earlier (before express.json) for broadcast function

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`🔌 WebSocket client connected from ${clientIp}`);

  // Add client to connected set
  connectedClients.add(ws);

  // READY Handshake: Immediately send READY message when client connects
  // This signals that the receiver is ready to accept file transfers
  ws.send(JSON.stringify({
    type: 'READY',
    role: 'receiver'
  }));
  console.log(`✅ Sent READY handshake to ${clientIp}`);

  // Handle incoming messages (signaling only)
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📨 WebSocket message:', data);

      // Handle different message types for signaling
      if (data.type === 'FILE_METADATA') {
        // Sender is announcing file transfer (file will come via HTTP POST /upload)
        // Support both single file and multiple files
        const files = data.files || [{ name: data.fileName, size: data.size }];
        const senderName = data.senderName || data.senderId || 'Unknown Device';

        console.log(`📤 File metadata received: ${files.length} file(s) from ${senderName}`);

        // Broadcast FILE_METADATA to ALL connected clients (including receiver UI)
        // This allows the receiver UI to show incoming files
        const metadataMessage = JSON.stringify({
          type: 'FILE_METADATA',
          transferId: data.transferId,
          files: files,
          senderId: data.senderId,
          senderName: senderName,
          timestamp: Date.now()
        });

        // Broadcast to all clients (both sender and receiver UI)
        connectedClients.forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(metadataMessage);
          }
        });

        // DO NOT auto-accept - receiver UI will send ACCEPT when user clicks Accept button
      } else if (data.type === 'ACCEPT') {
        // Receiver UI sent ACCEPT - forward to sender
        console.log('✅ ACCEPT received from receiver UI for transfer:', data.transferId);

        // Broadcast ACCEPT to all connected clients (sender will receive this)
        const acceptMessage = JSON.stringify({
          type: 'ACCEPT',
          transferId: data.transferId
        });

        let sentCount = 0;
        console.log(`📢 Broadcasting ACCEPT to ${connectedClients.size} connected clients...`);
        connectedClients.forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(acceptMessage);
            sentCount++;
          }
        });
        console.log(`📢 ACCEPT sent to ${sentCount} clients`);
      } else if (data.type === 'REJECT') {
        // Receiver UI sent REJECT - forward to sender
        console.log('❌ REJECT received from receiver UI for transfer:', data.transferId);

        const rejectMessage = JSON.stringify({
          type: 'REJECT',
          transferId: data.transferId
        });

        connectedClients.forEach(client => {
          if (client.readyState === 1) {
            client.send(rejectMessage);
          }
        });
      } else if (data.type === 'PROGRESS') {
        // Progress updates from sender - broadcast to receiver UI
        const progressMessage = JSON.stringify({
          type: 'PROGRESS',
          transferId: data.transferId,
          file: data.file,
          receivedBytes: data.receivedBytes,
          totalBytes: data.totalBytes,
          percentage: data.percentage || ((data.receivedBytes / data.totalBytes) * 100).toFixed(2)
        });

        // Broadcast progress to all clients (receiver UI will display it)
        connectedClients.forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(progressMessage);
          }
        });
      }
    } catch (error) {
      console.error('❌ WebSocket message error:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log(`🔌 WebSocket client disconnected from ${clientIp}`);
    connectedClients.delete(ws);
  });
});

// API endpoint to get discovered devices
app.get('/api/devices', (req, res) => {
  const devices = mdnsBrowser.getDevicesList();
  res.json({ devices });
});

// API endpoint to get this device info
app.get('/api/device/info', (req, res) => {
  res.json(deviceManager.getDeviceInfo());
});

// API endpoint to get device identity (for Flutter UI)
app.get('/api/device/identity', (req, res) => {
  const deviceInfo = deviceManager.getDeviceInfo();
  res.json({
    app: 'AnyDrop',
    name: deviceInfo.deviceName,
    id: deviceInfo.deviceId,
    deviceId: deviceInfo.deviceId,
    icon: 'laptop',
    type: 'DESKTOP',
    version: '1.0.0'
  });
});

// API endpoint to update device name
app.post('/api/device/name', async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Device name is required' });
  }

  const success = await deviceManager.updateDeviceName(name.trim());
  if (success) {
    // Restart mDNS advertising with new name
    const deviceId = deviceManager.getDeviceId();
    updateDeviceName(PORT, name.trim(), deviceId);
    res.json({
      success: true,
      device: deviceManager.getDeviceInfo()
    });
  } else {
    res.status(500).json({ error: 'Failed to update device name' });
  }
});

// Note: /pairing-code endpoint is handled by fileServer router (mounted at /)
// External devices can call /pairing-code with X-Device-Id header
// For convenience, we also expose it at /api/pairing-code without requiring header
app.get('/api/pairing-code', async (req, res) => {
  const deviceId = deviceManager.getDeviceId();
  if (!deviceId) {
    return res.status(500).json({ error: 'Device not initialized' });
  }

  // Import and use generatePairingCode directly
  const { generatePairingCode } = await import('./services/fileServer.js');
  const code = generatePairingCode(deviceId);
  res.json({ code, expiresIn: 300 });
});

// Initialize and start server
const startLocalFileTransferServer = async () => {
  try {
    // Connect to database (required for device ID persistence)
    try {
      await sequelize.authenticate();
      await sequelize.sync();
      console.log('✅ Database connected');
    } catch (dbError) {
      console.warn('⚠️ Database connection failed, using in-memory device ID:', dbError.message);
      console.warn('   Device ID will not persist across restarts');
    }

    // Initialize device manager (loads or creates deviceId)
    await deviceManager.initialize();
    const { deviceId, deviceName } = deviceManager.getDeviceInfo();

    // Start mDNS browser for device discovery
    mdnsBrowser.startBrowsing();

    // Listen for device discovery events
    mdnsBrowser.on('deviceDiscovered', (device) => {
      console.log(`📱 Discovered device: ${device.deviceName} (${device.ip}:${device.port})`);
    });

    mdnsBrowser.on('deviceRemoved', (device) => {
      console.log(`📱 Device removed: ${device.deviceName}`);
    });

    mdnsBrowser.on('deviceUpdated', (device) => {
      console.log(`📱 Device updated: ${device.deviceName}`);
    });

    // Start HTTP server
    // IMPORTANT: Bind to 0.0.0.0 (not localhost/127.0.0.1) to accept connections from all network interfaces
    // This allows devices on the same LAN (Wi-Fi, Ethernet) to connect for file transfer
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Local File Transfer Server running on 0.0.0.0:${PORT}`);
      console.log(`📱 Device: ${deviceName} (${deviceId})`);
      console.log(`🌐 Accessible from all network interfaces (Wi-Fi, Ethernet, etc.)`);
      console.log(`🔌 WebSocket server ready on ws://0.0.0.0:${PORT}/ws (signaling only)`);

      // Start mDNS advertising
      startAdvertising(PORT, deviceName, deviceId);
      console.log(`📡 mDNS discovery active - browsing for devices...`);
    });
  } catch (error) {
    console.error('❌ Failed to start local file transfer server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  stopAdvertising();
  mdnsBrowser.cleanup();
  cleanupAdvertiser();
  server.close(() => {
    console.log('Local file transfer server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  stopAdvertising();
  mdnsBrowser.cleanup();
  cleanupAdvertiser();
  server.close(() => {
    console.log('Local file transfer server closed');
    process.exit(0);
  });
});

// Start the server
startLocalFileTransferServer();
