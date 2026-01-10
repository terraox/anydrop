import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { HistoryItem } from '../models/index.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const historyItems = await HistoryItem.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json(historyItems);
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
