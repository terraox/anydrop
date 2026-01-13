import express from 'express';
import { Plan } from '../models/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const plans = await Plan.findAll();
        const config = {};

        if (!plans || plans.length === 0) {
            console.warn('No plans found in database. Returning default values.');
            // Return default values if no plans exist
            return res.json({
                free: {
                    id: 1,
                    name: 'FREE',
                    monthlyPrice: 0,
                    maxFileSizeMB: 100,
                    dailyTransferLimit: 3,
                    storageLimitGB: 1,
                    priorityProcessing: false
                },
                pro: {
                    id: 2,
                    name: 'PRO',
                    monthlyPrice: 499,
                    maxFileSizeMB: 2048,
                    dailyTransferLimit: -1,
                    storageLimitGB: 50,
                    priorityProcessing: true
                }
            });
        }

        plans.forEach(plan => {
            const plainPlan = plan.get({ plain: true });
            // Calculate derived fields for frontend
            const maxFileSizeMB = plainPlan.fileSizeLimit !== -1
                ? Math.floor(plainPlan.fileSizeLimit / (1024 * 1024))
                : -1;

            config[plan.name.toLowerCase()] = {
                id: plainPlan.id,
                name: plainPlan.name,
                monthlyPrice: plainPlan.monthlyPrice || 0,
                maxFileSizeMB: maxFileSizeMB,
                dailyTransferLimit: plainPlan.dailyTransferLimit !== undefined ? plainPlan.dailyTransferLimit : -1,
                storageLimitGB: plainPlan.storageLimitGB || 1,
                priorityProcessing: plainPlan.priorityProcessing || false
            };
        });

        // Ensure both free and pro plans are present
        if (!config.free) {
            console.warn('FREE plan not found, adding default');
            config.free = {
                id: 1,
                name: 'FREE',
                monthlyPrice: 0,
                maxFileSizeMB: 100,
                dailyTransferLimit: 3,
                storageLimitGB: 1,
                priorityProcessing: false
            };
        }
        if (!config.pro) {
            console.warn('PRO plan not found, adding default');
            config.pro = {
                id: 2,
                name: 'PRO',
                monthlyPrice: 499,
                maxFileSizeMB: 2048,
                dailyTransferLimit: -1,
                storageLimitGB: 50,
                priorityProcessing: true
            };
        }

        res.json(config);
    } catch (error) {
        console.error('Fetch plans error:', error);
        // Return default values on error so frontend doesn't break
        res.json({
            free: {
                id: 1,
                name: 'FREE',
                monthlyPrice: 0,
                maxFileSizeMB: 100,
                dailyTransferLimit: 3,
                storageLimitGB: 1,
                priorityProcessing: false
            },
            pro: {
                id: 2,
                name: 'PRO',
                monthlyPrice: 499,
                maxFileSizeMB: 2048,
                dailyTransferLimit: -1,
                storageLimitGB: 50,
                priorityProcessing: true
            }
        });
    }
});

export default router;
