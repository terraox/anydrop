import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { ServerSettings } from '../models/index.js';
import { startAdvertising } from '../services/discoveryService.js';
import dotenv from 'dotenv';

dotenv.config();
const PORT = process.env.PORT || 8080;

const router = express.Router();

router.put('/name', authenticate, async (req, res) => {
  try {
    const { deviceName, deviceIcon = 'laptop' } = req.body;

    // Update or create device_name setting
    let nameSetting = await ServerSettings.findOne({ where: { key: 'device_name' } });
    if (!nameSetting) {
      nameSetting = await ServerSettings.create({ key: 'device_name', value: deviceName });
    } else {
      nameSetting.value = deviceName;
      await nameSetting.save();
    }

    // Update or create device_icon setting
    let iconSetting = await ServerSettings.findOne({ where: { key: 'device_icon' } });
    if (!iconSetting) {
      iconSetting = await ServerSettings.create({ key: 'device_icon', value: deviceIcon });
    } else {
      iconSetting.value = deviceIcon;
      await iconSetting.save();
    }

    // Restart Bonjour advertising with new name
    try {
      startAdvertising(PORT, deviceName);
    } catch (e) {
      console.error('⚠️ Failed to restart Bonjour advertising:', e);
    }

    res.json({
      message: 'Device name updated successfully',
      deviceName
    });
  } catch (error) {
    console.error('Device name update error:', error);
    res.status(500).json({ error: 'Failed to update device name' });
  }
});

router.get('/identity', authenticate, async (req, res) => {
  try {
    const deviceNameSetting = await ServerSettings.findOne({ where: { key: 'device_name' } });
    const deviceIconSetting = await ServerSettings.findOne({ where: { key: 'device_icon' } });

    res.json({
      deviceName: deviceNameSetting?.value || 'AnyDrop-Server',
      deviceIcon: deviceIconSetting?.value || 'laptop'
    });
  } catch (error) {
    console.error('Device identity error:', error);
    res.status(500).json({ error: 'Failed to get device identity' });
  }
});

export default router;
