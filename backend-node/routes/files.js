import express from 'express';
import { upload, storeFile, getFile } from '../services/fileStorageService.js';
import { authenticate } from '../middleware/auth.js';
import { HistoryItem, User } from '../models/index.js';
import path from 'path';
import fs from 'fs';
import { lookup } from 'mime-types';

const router = express.Router();

router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = req.user;
    const historyItem = await storeFile(req.file, user);

    res.json(historyItem);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = await getFile(filename);

    // Determine content type
    const contentType = lookup(filePath) || 'application/octet-stream';
    const originalFilename = filename.split('-').slice(2).join('-'); // Remove timestamp prefix

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${originalFilename}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(404).json({ error: 'File not found' });
  }
});

// Direct streaming transfer endpoint (for device-to-device sharing)
router.post('/transfer', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`📦 Incoming transfer: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toStringAsFixed(2)}MB)`);

    // Store in history as anonymous transfer
    const historyItem = await storeFile(req.file, null);

    res.json({
      status: 'success',
      message: 'File received successfully',
      historyItem: historyItem
    });
  } catch (error) {
    console.error('Transfer endpoint error:', error);
    res.status(500).json({ error: 'Transfer failed' });
  }
});

export default router;
