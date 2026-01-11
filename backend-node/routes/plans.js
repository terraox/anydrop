import express from 'express';
import { Plan } from '../models/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const plans = await Plan.findAll();
        const config = {};

        plans.forEach(plan => {
            const plainPlan = plan.get({ plain: true });
            // Calculate derived fields for frontend
            const maxFileSizeMB = plainPlan.fileSizeLimit !== -1
                ? Math.floor(plainPlan.fileSizeLimit / (1024 * 1024))
                : -1;

            config[plan.name.toLowerCase()] = {
                id: plainPlan.id,
                name: plainPlan.name,
                monthlyPrice: plainPlan.monthlyPrice,
                maxFileSizeMB: maxFileSizeMB,
                dailyTransferLimit: plainPlan.dailyTransferLimit,
                storageLimitGB: plainPlan.storageLimitGB,
                priorityProcessing: plainPlan.priorityProcessing
            };
        });

        res.json(config);
    } catch (error) {
        console.error('Fetch plans error:', error);
        res.status(500).json({ error: 'Failed to fetch plan configuration' });
    }
});

export default router;
