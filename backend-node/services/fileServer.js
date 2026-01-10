import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import busboy from 'busboy';

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

// Note: We'll use busboy for streaming multipart parsing
// Install with: npm install busboy

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
   * Requires pairing code in X-Pairing-Code header
   * Uses streaming to avoid buffering entire file in memory
   */
  router.post('/upload', async (req, res) => {
    try {
      const deviceId = req.headers['x-device-id'];
      const pairingCode = req.headers['x-pairing-code'];
      const senderDeviceId = req.headers['x-sender-device-id'];

      // Validate pairing code
      if (!deviceId || !pairingCode) {
        return res.status(400).json({ error: 'Device ID and pairing code required' });
      }

      if (!validatePairingCode(deviceId, pairingCode)) {
        console.warn(`❌ Invalid pairing code from ${senderDeviceId || 'unknown'}`);
        return res.status(403).json({ error: 'Invalid or expired pairing code' });
      }

      // Use busboy for streaming multipart parsing
      const bb = busboy({ headers: req.headers });
      
      let originalName = 'unnamed';
      let savedFilename = null;
      let fileSize = 0;
      let totalBytes = 0; // Expected total size (if provided in headers)
      let receivedBytes = 0;
      let writeStream = null;
      let hasError = false;
      let transferId = req.headers['x-transfer-id'] || `transfer-${Date.now()}`;
      let lastProgressUpdate = 0;
      const PROGRESS_UPDATE_INTERVAL = 100; // Update every 100ms

      // Get expected file size from headers if available
      const contentLength = req.headers['content-length'];
      if (contentLength) {
        totalBytes = parseInt(contentLength, 10);
      }

      bb.on('file', (name, file, info) => {
        originalName = info.filename || 'unnamed';
        const timestamp = Date.now();
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
        savedFilename = `${timestamp}-${sanitizedName}`;
        const filePath = path.join(uploadsDir, savedFilename);

        // Get file size from Content-Length header if available
        if (info.encoding && info.mimeType) {
          // File info available
        }

        // Create write stream for file
        writeStream = fs.createWriteStream(filePath);

        writeStream.on('error', (err) => {
          console.error('❌ Write stream error:', err);
          hasError = true;
          
          // Broadcast error to WebSocket clients
          if (broadcastProgress) {
            broadcastProgress({
              type: 'TRANSFER_ERROR',
              transferId: transferId,
              file: originalName,
              error: err.message
            });
          }
          
          if (!res.headersSent) {
            res.status(500).json({ error: 'File write failed', message: err.message });
          }
        });

        // Stream file data directly to disk (no buffering)
        // Track progress and emit updates via WebSocket
        file.on('data', (chunk) => {
          if (!hasError && writeStream) {
            receivedBytes += chunk.length;
            fileSize = receivedBytes;
            writeStream.write(chunk);
            
            // Emit progress updates (throttled to avoid flooding)
            const now = Date.now();
            if (broadcastProgress && (now - lastProgressUpdate >= PROGRESS_UPDATE_INTERVAL || receivedBytes === totalBytes)) {
              const percentage = totalBytes > 0 ? ((receivedBytes / totalBytes) * 100).toFixed(2) : '0.00';
              
              broadcastProgress({
                type: 'PROGRESS',
                transferId: transferId,
                file: originalName,
                receivedBytes: receivedBytes,
                totalBytes: totalBytes || receivedBytes, // Use receivedBytes as fallback
                percentage: parseFloat(percentage)
              });
              
              lastProgressUpdate = now;
            }
          }
        });

        file.on('end', () => {
          if (writeStream && !hasError) {
            writeStream.end();
          }
        });

        file.on('error', (err) => {
          console.error('❌ File stream error:', err);
          hasError = true;
          if (writeStream) {
            writeStream.destroy();
          }
          if (!res.headersSent) {
            res.status(500).json({ error: 'File stream error', message: err.message });
          }
        });
      });

      bb.on('finish', () => {
        if (hasError) {
          return;
        }

        // Wait for write stream to finish
        if (writeStream) {
          writeStream.on('close', () => {
            const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
            console.log(`📦 File received: ${originalName} (${fileSizeMB}MB) from ${senderDeviceId || 'unknown'}`);

            // Broadcast completion to WebSocket clients
            if (broadcastProgress) {
              broadcastProgress({
                type: 'TRANSFER_COMPLETE',
                transferId: transferId,
                file: originalName,
                filename: originalName,
                savedAs: savedFilename,
                size: fileSize,
                downloadUrl: `/api/files/${savedFilename}`
              });
            }

            // Cleanup pairing code after successful transfer
            pairingCodes.delete(deviceId);

            if (!res.headersSent) {
              res.json({
                status: 'success',
                message: 'File received successfully',
                filename: originalName,
                size: fileSize,
                savedAs: savedFilename,
                downloadUrl: `/api/files/${savedFilename}`
              });
            }
          });
        } else {
          // No file was received
          if (!res.headersSent) {
            res.status(400).json({ error: 'No file uploaded' });
          }
        }
      });

      bb.on('error', (error) => {
        console.error('❌ Busboy error:', error);
        hasError = true;
        if (writeStream) {
          writeStream.destroy();
        }
        if (!res.headersSent) {
          res.status(500).json({ error: 'File upload failed', message: error.message });
        }
      });

      // Pipe request to busboy for streaming parsing
      req.pipe(bb);
    } catch (error) {
      console.error('❌ File upload error:', error);
      res.status(500).json({ error: 'File upload failed', message: error.message });
    }
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
