import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
// NOTE: busboy removed - using raw streaming with req.pipe(out) for /upload

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Store active pairing codes: deviceId -> { code, expiresAt }
const pairingCodes = new Map();

/**
 * Generate a short pairing code (6 digits)
 */
export const generatePairingCode = (deviceId) => {
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  pairingCodes.set(deviceId, { code, expiresAt });

  // Cleanup expired codes
  setTimeout(() => {
    pairingCodes.delete(deviceId);
  }, 5 * 60 * 1000);

  return code;
};

/**
 * Validate pairing code
 */
const validatePairingCode = (deviceId, code) => {
  const stored = pairingCodes.get(deviceId);
  if (!stored) {
    return false;
  }

  if (Date.now() > stored.expiresAt) {
    pairingCodes.delete(deviceId);
    return false;
  }

  return stored.code === code;
};

/**
 * Create Express router for file server endpoints
 * @param {Function} broadcastProgress - Function to broadcast progress updates to WebSocket clients
 */
export const createFileServerRouter = (broadcastProgress = null) => {
  const router = express.Router();

  /**
   * GET /pairing-code
   * Generate a pairing code for this device
   * Can use X-Device-Id header or deviceManager if available
   */
  router.get('/pairing-code', async (req, res) => {
    let deviceId = req.headers['x-device-id'];

    // If no header, try to get from deviceManager (for local requests)
    if (!deviceId) {
      try {
        const deviceManager = (await import('./deviceManager.js')).default;
        deviceId = deviceManager.getDeviceId();
      } catch (e) {
        // deviceManager not available, require header
      }
    }

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID required (provide X-Device-Id header)' });
    }

    const code = generatePairingCode(deviceId);
    console.log(`🔐 Generated pairing code for ${deviceId}: ${code}`);

    res.json({ code, expiresIn: 300 }); // 5 minutes
  });

  /**
   * POST /upload
   * Receive file stream from another device
   * 
   * ❌ Do NOT use express.json
   * ❌ Do NOT use multer
   * ❌ Do NOT use busboy for this endpoint
   * ✅ Use raw streaming: req.pipe(out)
   * 
   * Expected headers:
   * - X-File-Name: Original filename
   * - Content-Type: application/octet-stream
   * - Content-Length: File size in bytes
   * - X-Transfer-Id: Transfer ID from WebSocket signaling
   */
  router.post('/upload', (req, res) => {
    const fileName = req.headers['x-file-name'] || 'unnamed';
    const transferId = req.headers['x-transfer-id'] || req.query.transferId || `transfer-${Date.now()}`;
    const senderDeviceId = req.headers['x-sender-device-id'] || 'unknown';
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    console.log(`📤 RAW STREAMING upload starting:`, {
      fileName,
      transferId,
      senderDeviceId,
      contentLength: `${(contentLength / 1024 / 1024).toFixed(2)} MB`
    });

    // Sanitize filename
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const savedFilename = `${timestamp}-${sanitizedName}`;
    const filePath = path.join(uploadsDir, savedFilename);

    // Create write stream
    const out = fs.createWriteStream(filePath);

    // Track progress
    let receivedBytes = 0;
    let lastProgressUpdate = 0;
    const PROGRESS_UPDATE_INTERVAL = 100; // Update every 100ms

    // Handle incoming data chunks for progress tracking
    req.on('data', (chunk) => {
      receivedBytes += chunk.length;

      const now = Date.now();
      if (broadcastProgress && (now - lastProgressUpdate >= PROGRESS_UPDATE_INTERVAL || receivedBytes === contentLength)) {
        const percentage = contentLength > 0 ? ((receivedBytes / contentLength) * 100) : 0;

        broadcastProgress({
          type: 'PROGRESS',
          transferId: transferId,
          file: fileName,
          receivedBytes: receivedBytes,
          totalBytes: contentLength || receivedBytes,
          percentage: parseFloat(percentage.toFixed(2))
        });

        lastProgressUpdate = now;
      }
    });

    // MANDATORY: Pipe request directly to file (raw streaming)
    req.pipe(out);

    // Handle write stream errors
    out.on('error', (err) => {
      console.error('❌ Write stream error:', err);

      if (broadcastProgress) {
        broadcastProgress({
          type: 'TRANSFER_ERROR',
          transferId: transferId,
          file: fileName,
          error: err.message
        });
      }

      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: 'File write failed', message: err.message });
      }
    });

    // Handle request end (file fully received)
    req.on('end', () => {
      out.end();
    });

    // Handle write stream close (file saved to disk)
    out.on('close', () => {
      const fileSizeMB = (receivedBytes / 1024 / 1024).toFixed(2);
      console.log(`✅ FILE SAVED: ${fileName} (${fileSizeMB} MB) -> ${savedFilename}`);

      // Broadcast completion to WebSocket clients
      if (broadcastProgress) {
        broadcastProgress({
          type: 'TRANSFER_COMPLETE',
          transferId: transferId,
          file: fileName,
          filename: fileName,
          savedAs: savedFilename,
          size: receivedBytes,
          downloadUrl: `/api/files/${savedFilename}`
        });
      }

      if (!res.headersSent) {
        res.json({
          ok: true,
          status: 'success',
          message: 'File received successfully',
          filename: fileName,
          size: receivedBytes,
          savedAs: savedFilename,
          downloadUrl: `/api/files/${savedFilename}`
        });
      }
    });

    // Handle request errors
    req.on('error', (err) => {
      console.error('❌ Request stream error:', err);
      out.destroy();

      if (broadcastProgress) {
        broadcastProgress({
          type: 'TRANSFER_ERROR',
          transferId: transferId,
          file: fileName,
          error: err.message
        });
      }

      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: 'Upload failed', message: err.message });
      }
    });
  });

  /**
   * GET /api/files/:filename
   * Download a received file
   * Supports mobile browsers by triggering download via user action
   */
  router.get('/api/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stat = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);

    // Extract original filename from saved filename (format: timestamp-originalname)
    const originalFilename = filename.includes('-')
      ? filename.substring(filename.indexOf('-') + 1)
      : filename;

    // Set headers for download (mobile browser compatible)
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${originalFilename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Stream file to client (for mobile browser downloads)
    fileStream.pipe(res);
  });

  /**
   * GET /files/:filename (legacy endpoint, redirects to /api/files/:filename)
   */
  router.get('/files/:filename', (req, res) => {
    res.redirect(`/api/files/${req.params.filename}`);
  });

  /**
   * GET /files
   * List all received files
   */
  router.get('/files', (req, res) => {
    try {
      const files = fs.readdirSync(uploadsDir)
        .map(filename => {
          const filePath = path.join(uploadsDir, filename);
          const stat = fs.statSync(filePath);
          return {
            filename,
            size: stat.size,
            createdAt: stat.birthtime
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);

      res.json({ files });
    } catch (error) {
      console.error('Error listing files:', error);
      res.status(500).json({ error: 'Failed to list files' });
    }
  });

  return router;
};
