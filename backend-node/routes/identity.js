import express from 'express';
import { ServerSettings } from '../models/index.js';

const router = express.Router();

router.get('/identify', async (req, res) => {
  try {
    const deviceNameSetting = await ServerSettings.findOne({ where: { key: 'device_name' } });
    const deviceIconSetting = await ServerSettings.findOne({ where: { key: 'device_icon' } });

    const deviceName = deviceNameSetting?.value || 'AnyDrop-Server';
    const deviceIcon = deviceIconSetting?.value || 'laptop';

    res.json({
      name: deviceName,
      icon: deviceIcon,
      type: 'DESKTOP',
      app: 'AnyDrop',
      version: '1.0.0',
      id: deviceName,
      deviceId: deviceName
    });
  } catch (error) {
    console.error('Identity error:', error);
    res.status(500).json({ error: 'Failed to get identity' });
  }
});

// This will be populated by WebSocket handler
let registeredDevices = [];

export const setRegisteredDevices = (devices) => {
  registeredDevices = devices;
};

router.get('/devices', async (req, res) => {
  try {
    const devices = registeredDevices.map(device => ({
      id: device.deviceId,
      name: device.name,
      type: device.type || 'DESKTOP',
      icon: device.icon || 'laptop',
      deviceId: device.deviceId
    }));

    res.json(devices);
  } catch (error) {
    console.error('Devices error:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

export default router;
