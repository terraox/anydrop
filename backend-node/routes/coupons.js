import express from 'express';
import { Coupon } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

router.post('/verify', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Coupon code is required' });
        }

        const coupon = await Coupon.findOne({
            where: { code: code.toUpperCase() }
        });

        if (!coupon) {
            return res.status(404).json({ error: 'Invalid coupon code' });
        }

        const now = new Date();

        // Check expiry
        if (new Date(coupon.validUntil) < now) {
            return res.status(400).json({ error: 'Coupon has expired' });
        }

        // Check usage limit
        if (coupon.usageLimit !== -1 && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ error: 'Coupon usage limit reached' });
        }

        res.json({
            valid: true,
            code: coupon.code,
            discountPercent: coupon.discount,
            message: 'Coupon applied successfully'
        });

    } catch (error) {
        console.error('Coupon verification error:', error);
        res.status(500).json({ error: 'Failed to verify coupon' });
    }
});

export default router;
