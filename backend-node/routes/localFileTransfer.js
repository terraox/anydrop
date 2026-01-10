import express from 'express';
import fileSender from '../services/fileSender.js';
import mdnsBrowser from '../services/mdnsBrowser.js';
import deviceManager from '../services/deviceManager.js';

const router = express.Router();

/**
 * POST /api/transfer/send
 * Send a file to another device
 * Body: { targetDeviceId, filePath }
 */
router.post('/send', async (req, res) => {
  try {
    const { targetDeviceId, filePath } = req.body;

    if (!targetDeviceId || !filePath) {
      return res.status(400).json({ error: 'targetDeviceId and filePath are required' });
    }

    // Get target device from mDNS browser
    const targetDevice = mdnsBrowser.getDevice(targetDeviceId);
    if (!targetDevice) {
      return res.status(404).json({ error: 'Target device not found. Make sure it is on the same network.' });
    }

    // Get pairing code from target device
    const pairingCodeResponse = await fetch(`http://${targetDevice.ip}:${targetDevice.port}/api/pairing-code`, {
      method: 'GET',
      headers: {
        'X-Device-Id': targetDevice.deviceId
      }
    });

    if (!pairingCodeResponse.ok) {
      return res.status(500).json({ error: 'Failed to get pairing code from target device' });
    }

    const { code: pairingCode } = await pairingCodeResponse.json();

    // Get sender device ID
    const senderDeviceId = deviceManager.getDeviceId();

    // Send file
    fileSender.on('progress', (data) => {
      // Emit progress via SSE or WebSocket if needed
      console.log(`📤 Transfer progress: ${data.progress.toFixed(1)}%`);
    });

    const result = await fileSender.sendFile(filePath, targetDevice, pairingCode, senderDeviceId);

    res.json({
      status: 'success',
      message: 'File sent successfully',
      result
    });
  } catch (error) {
    console.error('❌ File send error:', error);
    res.status(500).json({ error: 'File send failed', message: error.message });
  }
});

/**
 * GET /api/transfer/devices
 * Get list of discovered devices
 */
router.get('/devices', (req, res) => {
  const devices = mdnsBrowser.getDevicesList();
  res.json({ devices });
});

export default router;
