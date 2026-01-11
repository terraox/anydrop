import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { WebSocketServer } from 'ws';
import { sequelize } from './models/index.js';
import { corsOptions } from './middleware/cors.js';
import rateLimit from 'express-rate-limit';

// Routes
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';
import historyRoutes from './routes/history.js';
import identityRoutes from './routes/identity.js';
import deviceRoutes from './routes/device.js';
import adminRoutes from './routes/admin.js';
import couponsRoutes from './routes/coupons.js';
import plansRoutes from './routes/plans.js';

// WebSocket handlers (STOMP-based for legacy)
import { handleTransferConnection, getRegisteredDevices } from './websocket/transferHandler.js';
import { setRegisteredDevices } from './routes/identity.js';

// Local file transfer modules
import { startAdvertising, stopAdvertising } from './services/discoveryService.js';
import { createFileServerRouter, generatePairingCode } from './services/fileServer.js';
import deviceManager from './services/deviceManager.js';
import mdnsBrowser from './services/mdnsBrowser.js';
import { ServerSettings } from './models/index.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Socket.IO for legacy WebSocket (STOMP-based)
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Plain WebSocket server for local file transfer signaling (on /ws path)
const wss = new WebSocketServer({ server, path: '/ws' });
const connectedClients = new Set();

// Broadcast function for progress updates to all connected clients
function broadcastToClients(message) {
  const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
  let sentCount = 0;
  connectedClients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(messageStr);
      sentCount++;
    }
  });
  if (sentCount > 0) {
    console.log(`📢 Broadcast to ${sentCount} clients`);
  }
}

const PORT = process.env.PORT || 8080;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);
app.use(cors({
  origin: true,
  credentials: true
}));

// ⚠️ IMPORTANT: Mount file server routes BEFORE express.json()
// This ensures /upload receives raw streaming (application/octet-stream)
app.use('/', createFileServerRouter(broadcastToClients));

// Now add JSON parsing for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Device identification endpoint (for mobile discovery)
app.get('/api/identify', async (req, res) => {
  const deviceId = deviceManager.getDeviceId();
  const deviceName = deviceManager.getDeviceName();
  console.log(`📱 /api/identify called - returning: { deviceId: '${deviceId}', deviceName: '${deviceName}' }`);
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/history', historyRoutes);
app.use('/api', identityRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/plans', plansRoutes);
app.use('/admin', adminRoutes);

// Device discovery endpoints
app.get('/api/devices', (req, res) => {
  const devices = mdnsBrowser.getDevicesList();
  res.json({ devices });
});

app.get('/api/device/info', (req, res) => {
  res.json({
    success: true,
    device: deviceManager.getDeviceInfo()
  });
});

app.put('/api/device/name', express.json(), async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const success = await deviceManager.setDeviceName(name);
  if (success) {
    res.json({
      success: true,
      device: deviceManager.getDeviceInfo()
    });
  } else {
    res.status(500).json({ error: 'Failed to update device name' });
  }
});

// Pairing code endpoint
app.get('/api/pairing-code', async (req, res) => {
  const deviceId = deviceManager.getDeviceId();
  if (!deviceId) {
    return res.status(500).json({ error: 'Device not initialized' });
  }
  const code = generatePairingCode(deviceId);
  res.json({ code, expiresIn: 300 });
});

// Initialize Socket.IO handlers (legacy)
handleTransferConnection(io);

// Update registered devices periodically
setInterval(() => {
  setRegisteredDevices(getRegisteredDevices());
}, 5000);

// Plain WebSocket handler for local file transfer signaling
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`🔌 WebSocket client connected from ${clientIp}`);
  connectedClients.add(ws);

  // Send READY handshake
  ws.send(JSON.stringify({ type: 'READY', role: 'receiver' }));
  console.log(`✅ Sent READY handshake to ${clientIp}`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📨 WebSocket message:', data);

      if (data.type === 'FILE_METADATA') {
        const files = data.files || [{ name: data.fileName, size: data.size }];
        const senderName = data.senderName || data.senderId || 'Unknown Device';
        console.log(`📤 File metadata received: ${files.length} file(s) from ${senderName}`);

        const metadataMessage = JSON.stringify({
          type: 'FILE_METADATA',
          transferId: data.transferId,
          files: files,
          senderId: data.senderId,
          senderName: senderName,
          timestamp: Date.now()
        });

        connectedClients.forEach(client => {
          if (client.readyState === 1) client.send(metadataMessage);
        });

      } else if (data.type === 'ACCEPT') {
        console.log('✅ ACCEPT received for transfer:', data.transferId);
        const acceptMessage = JSON.stringify({
          type: 'ACCEPT',
          transferId: data.transferId
        });
        console.log(`📢 Broadcasting ACCEPT to ${connectedClients.size} clients`);
        let sentCount = 0;
        connectedClients.forEach(client => {
          if (client.readyState === 1) {
            client.send(acceptMessage);
            sentCount++;
          }
        });
        console.log(`📢 ACCEPT sent to ${sentCount} clients`);

      } else if (data.type === 'REJECT') {
        console.log('❌ REJECT received for transfer:', data.transferId);
        const rejectMessage = JSON.stringify({
          type: 'REJECT',
          transferId: data.transferId
        });
        connectedClients.forEach(client => {
          if (client.readyState === 1) client.send(rejectMessage);
        });

      } else if (data.type === 'PROGRESS') {
        const progressMessage = JSON.stringify({
          type: 'PROGRESS',
          transferId: data.transferId,
          file: data.file,
          percentage: data.percentage,
          receivedBytes: data.receivedBytes,
          totalBytes: data.totalBytes
        });
        connectedClients.forEach(client => {
          if (client.readyState === 1) client.send(progressMessage);
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

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🔌 Attempting to connect to database...');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'anydrop'}`);
    console.log(`   User: ${process.env.DB_USER || 'anydrop_user'}`);

    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Use alter: true to update tables with new columns (e.g. monthlyPrice in Plan)
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synced');

    await initializeDefaultData();

    // Initialize device manager
    await deviceManager.initialize();

    server.listen(PORT, '0.0.0.0', async () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket server ready (Socket.IO + plain WebSocket at /ws)`);
      console.log(`📁 File transfer endpoint: /upload`);
      console.log(`🔐 Auth endpoint: /api/auth/login`);

      // Start mDNS advertising
      try {
        const deviceName = deviceManager.getDeviceName();
        startAdvertising(PORT, deviceName);
        console.log(`📡 mDNS advertising: ${deviceName}`);
      } catch (e) {
        console.error('⚠️ Failed to start mDNS advertising:', e);
      }

      // Start mDNS browser for device discovery
      mdnsBrowser.startBrowsing();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);

    if (error.name === 'SequelizeConnectionError') {
      console.error('\n📋 Database Connection Troubleshooting:');
      console.error('   1. Check that PostgreSQL is running');
      console.error('   2. Verify database credentials in .env file');
      console.error('   3. Ensure the database user exists');
      console.error('   4. Check network connectivity to database host');
    }

    console.error('\n💡 Tip: Check backend-node/.env file for correct database credentials');
    process.exit(1);
  }
};

const initializeDefaultData = async () => {
  const { User, Plan, ServerSettings } = await import('./models/index.js');

  // Initialize device name if not set
  const deviceNameSetting = await ServerSettings.findOne({ where: { key: 'device_name' } });
  if (!deviceNameSetting || deviceNameSetting.value === 'AnyDrop-Server') {
    if (deviceNameSetting) {
      await deviceNameSetting.update({ value: 'AnyDrop-Desktop' });
    } else {
      await ServerSettings.create({ key: 'device_name', value: 'AnyDrop-Desktop' });
    }
    console.log('✅ Device name updated to AnyDrop-Desktop');
  }

  // Initialize plans
  // Check for FREE plan
  let freePlan = await Plan.findOne({ where: { name: 'FREE' } });
  if (!freePlan) {
    freePlan = await Plan.create({
      name: 'FREE',
      speedLimit: 5000000, // 5MB/s
      fileSizeLimit: 2 * 1024 * 1024 * 1024, // 2 GB
      dailyTransferLimit: 5,
      storageLimitGB: 1,
      monthlyPrice: 0,
      priorityProcessing: false
    });
    console.log('✅ FREE plan created (2GB Limit)');
  }

  // Check for PRO plan
  let proPlan = await Plan.findOne({ where: { name: 'PRO' } });
  if (!proPlan) {
    proPlan = await Plan.create({
      name: 'PRO',
      speedLimit: -1,
      fileSizeLimit: -1, // Unlimited
      dailyTransferLimit: -1,
      storageLimitGB: 100,
      monthlyPrice: 499,
      priorityProcessing: true
    });
    console.log('✅ PRO plan created (Unlimited)');
  }

  // Initialize default admin user
  const adminUser = await User.findOne({ where: { email: 'admin@anydrop.com' } });
  if (!adminUser) {
    await User.create({
      username: 'admin',
      email: 'admin@anydrop.com',
      password: 'admin123',
      role: 'ADMIN', // Changed from ROLE_ADMIN to match standard
      enabled: true,
      planId: proPlan.id
    });
    console.log('✅ Default admin user created: admin@anydrop.com / admin123');
  } else {
    // Ensure admin has PRO plan and correct role
    if (adminUser.planId !== proPlan.id) {
      adminUser.planId = proPlan.id;
      await adminUser.save();
    }
    // Update password if needed (can be removed if user changed it)
    // adminUser.password = 'admin123'; 
    if (adminUser.role !== 'ADMIN') {
      adminUser.role = 'ADMIN';
      await adminUser.save();
    }
    console.log('✅ Admin user verified');
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  stopAdvertising();
  mdnsBrowser.cleanup();
  await sequelize.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  stopAdvertising();
  mdnsBrowser.cleanup();
  await sequelize.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();
