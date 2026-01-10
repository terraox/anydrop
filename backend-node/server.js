import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
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

// WebSocket handlers
import { handleTransferConnection, getRegisteredDevices } from './websocket/transferHandler.js';
import { setRegisteredDevices } from './routes/identity.js';
import { startAdvertising } from './services/discoveryService.js';
import { ServerSettings } from './models/index.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 8080;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/history', historyRoutes);
app.use('/api', identityRoutes);
app.use('/api/device', deviceRoutes);
app.use('/admin', adminRoutes);

// Initialize WebSocket handlers
handleTransferConnection(io);

// Update registered devices periodically for /api/devices endpoint
setInterval(() => {
  setRegisteredDevices(getRegisteredDevices());
}, 5000);

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection with better error handling
    console.log('🔌 Attempting to connect to database...');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'anydrop'}`);
    console.log(`   User: ${process.env.DB_USER || 'anydrop_user'}`);

    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync database models (creates tables if they don't exist)
    await sequelize.sync();
    console.log('✅ Database models synced');

    // Initialize default data
    await initializeDefaultData();

    server.listen(PORT, '0.0.0.0', async () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket server ready`);

      // Start Bonjour advertising
      try {
        const deviceNameSetting = await ServerSettings.findOne({ where: { key: 'device_name' } });
        const deviceName = deviceNameSetting?.value || 'AnyDrop-Desktop';
        startAdvertising(PORT, deviceName);
      } catch (e) {
        console.error('⚠️ Failed to start Bonjour advertising:', e);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);

    if (error.name === 'SequelizeConnectionError') {
      console.error('\n📋 Database Connection Troubleshooting:');
      console.error('   1. Check that PostgreSQL is running');
      console.error('   2. Verify database credentials in .env file');
      console.error('   3. Ensure the database user exists');
      console.error('   4. Check network connectivity to database host');
      console.error(`\n   Current config: ${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    }

    console.error('\n💡 Tip: Check backend-node/.env file for correct database credentials');
    process.exit(1);
  }
};

const initializeDefaultData = async () => {
  const { User, Plan, ServerSettings } = await import('./models/index.js');
  const bcrypt = (await import('bcryptjs')).default;

  // Initialize device name if not set or if it's the old default
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
  const planCount = await Plan.count();
  if (planCount === 0) {
    await Plan.create({
      name: 'SCOUT',
      speedLimit: 500000,
      fileSizeLimit: 50000000
    });

    await Plan.create({
      name: 'TITAN',
      speedLimit: -1,
      fileSizeLimit: -1
    });

    console.log('✅ Plans initialized');
  }

  // Initialize default admin user
  const adminUser = await User.findOne({ where: { email: 'admin@anydrop.com' } });
  if (!adminUser) {
    const titanPlan = await Plan.findOne({ where: { name: 'TITAN' } });

    await User.create({
      username: 'admin',
      email: 'admin@anydrop.com',
      password: 'admin123',
      role: 'ROLE_ADMIN',
      planId: titanPlan.id
    });

    console.log('✅ Default admin user created: admin@anydrop.com / admin123');
  } else {
    // Ensure admin password and role are correct
    adminUser.password = 'admin123';
    adminUser.role = 'ROLE_ADMIN';
    await adminUser.save();
    console.log('✅ Default admin password and role forced reset: admin123 / ROLE_ADMIN');
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await sequelize.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();
