import express from 'express';
import { upload, storeFile, getFile } from '../services/fileStorageService.js';
import { authenticate } from '../middleware/auth.js';
import { HistoryItem, User } from '../models/index.js';
import path from 'path';
import fs from 'fs';
import { lookup } from 'mime-types';

import { Op } from 'sequelize';

const router = express.Router();

router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = req.user;

    // 1. Check File Size Limit
    if (user.plan && user.plan.fileSizeLimit !== -1) {
      if (req.file.size > user.plan.fileSizeLimit) {
        console.log(`❌ Upload rejected: File size ${req.file.size} exceeds limit ${user.plan.fileSizeLimit}`);
        return res.status(403).json({
          error: `File too large. Your plan limit is ${(user.plan.fileSizeLimit / (1024 * 1024)).toFixed(0)}MB.`
        });
      }
    }

    // 2. Check Daily Transfer Limit
    if (user.plan && user.plan.dailyTransferLimit !== -1) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const count = await HistoryItem.count({
        where: {
          userId: user.id,
          createdAt: { [Op.gte]: startOfDay }
        }
      });

      if (count >= user.plan.dailyTransferLimit) {
        console.log(`❌ Upload rejected: Daily limit reached for user ${user.email} (${count}/${user.plan.dailyTransferLimit})`);
        return res.status(403).json({
          error: `Daily transfer limit reached (${user.plan.dailyTransferLimit}/day). Upgrade for unlimited!`
        });
      }
    }

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
