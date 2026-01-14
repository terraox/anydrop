import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { User, HistoryItem, Coupon, Transaction, Plan } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalFiles = await HistoryItem.count();
    const totalSize = await HistoryItem.sum('fileSize') || 0;
    const activeUsers = await User.count({ where: { enabled: true } });

    res.json({
      totalUsers,
      activeUsers,
      totalFiles,
      totalSize,
      bannedUsers: totalUsers - activeUsers
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

// Recent activity (dummy data for now)
router.get('/dashboard/activity', (req, res) => {
  res.json([
    { action: 'New user registered', user: 'alice@example.com', time: '2 min ago' },
    { action: 'File transfer completed', user: 'bob@example.com', time: '5 min ago' },
    { action: 'Pro plan activated', user: 'charlie@example.com', time: '15 min ago' }
  ]);
});

// Transfers chart (dummy data)
router.get('/dashboard/transfers-chart', (req, res) => {
  res.json([
    { name: 'Mon', files: 120 },
    { name: 'Tue', files: 250 },
    { name: 'Wed', files: 180 },
    { name: 'Thu', files: 310 },
    { name: 'Fri', files: 290 },
    { name: 'Sat', files: 100 },
    { name: 'Sun', files: 140 }
  ]);
});

// Users
router.get('/users', async (req, res) => {
  try {
    const { search, status, page = 0, size = 20 } = req.query;
    const offset = parseInt(page) * parseInt(size);
    const limit = parseInt(size);

    const where = {};
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { username: { [Op.iLike]: `%${search}%` } }
      ];
    }
    // Only filter by status if explicitly provided and not empty
    if (status === 'banned') {
      where.enabled = false;
    } else if (status === 'active') {
      where.enabled = true;
    }
    // If status is undefined, null, or empty string, don't filter (get all users)

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [{
        model: Plan,
        as: 'plan',
        required: false // Explicit LEFT JOIN to include users without plans
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      content: rows,
      totalElements: count,
      totalPages: Math.ceil(count / limit),
      size: limit,
      number: parseInt(page)
    });
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

router.post('/users/:id/ban', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.enabled = false;
    user.accountNonLocked = false;
    await user.save();
    res.json({ message: 'User banned successfully' });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

router.post('/users/:id/unban', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.enabled = true;
    user.accountNonLocked = true;
    await user.save();
    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// Files
router.get('/files', async (req, res) => {
  try {
    const { search, page = 0, size = 20 } = req.query;
    const offset = parseInt(page) * parseInt(size);
    const limit = parseInt(size);

    const where = {};
    if (search) {
      where.fileName = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await HistoryItem.findAndCountAll({
      where,
      include: [{ model: User, as: 'user' }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      content: rows,
      totalElements: count,
      totalPages: Math.ceil(count / limit),
      size: limit,
      number: parseInt(page)
    });
  } catch (error) {
    console.error('Files error:', error);
    res.status(500).json({ error: 'Failed to get files' });
  }
});

// Coupons
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
    res.json(coupons);
  } catch (error) {
    console.error('Coupons error:', error);
    res.status(500).json({ error: 'Failed to get coupons' });
  }
});

router.post('/coupons', async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.json(coupon);
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ error: error.message || 'Failed to create coupon' });
  }
});

router.delete('/coupons/:id', async (req, res) => {
  try {
    await Coupon.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// Plan Configuration
router.get('/plans/config', async (req, res) => {
  try {
    const plans = await Plan.findAll();
    const config = {};
    // Ensure we send back lowercase keys as expected by frontend (free, pro)
    plans.forEach(plan => {
      const plainPlan = plan.get({ plain: true });
      // Convert Bytes to MB for frontend
      if (plainPlan.fileSizeLimit !== -1) {
        plainPlan.maxFileSizeMB = Math.floor(plainPlan.fileSizeLimit / (1024 * 1024));
      } else {
        plainPlan.maxFileSizeMB = -1;
      }
      // Ensure all fields are included in response
      config[plan.name.toLowerCase()] = {
        id: plainPlan.id,
        name: plainPlan.name,
        maxFileSizeMB: plainPlan.maxFileSizeMB,
        dailyTransferLimit: plainPlan.dailyTransferLimit,
        storageLimitGB: plainPlan.storageLimitGB,
        monthlyPrice: plainPlan.monthlyPrice,
        priorityProcessing: plainPlan.priorityProcessing,
        speedLimit: plainPlan.speedLimit,
        fileSizeLimit: plainPlan.fileSizeLimit
      };
    });
    res.json(config);
  } catch (error) {
    console.error('Get plans config error:', error);
    res.status(500).json({ error: 'Failed to get plan config' });
  }
});

router.put('/plans/config', async (req, res) => {
  try {
    const { planName, maxFileSizeMB, dailyTransferLimit, storageLimitGB, priorityProcessing, monthlyPrice } = req.body;
    if (!planName) {
      return res.status(400).json({ error: 'Plan name is required' });
    }
    const plan = await Plan.findOne({ where: { name: planName } });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const updates = {};

    // Convert MB to Bytes for storage
    if (maxFileSizeMB !== undefined) {
      if (maxFileSizeMB === -1) {
        updates.fileSizeLimit = -1;
      } else {
        updates.fileSizeLimit = maxFileSizeMB * 1024 * 1024;
      }
    }

    // Handle other fields
    if (dailyTransferLimit !== undefined) {
      updates.dailyTransferLimit = dailyTransferLimit;
    }
    if (storageLimitGB !== undefined) {
      updates.storageLimitGB = storageLimitGB;
    }
    if (priorityProcessing !== undefined) {
      updates.priorityProcessing = priorityProcessing;
    }
    if (monthlyPrice !== undefined) {
      updates.monthlyPrice = monthlyPrice;
    }

    await plan.update(updates);

    // Return updated plan with converted fields for frontend
    const updatedPlan = plan.get({ plain: true });
    if (updatedPlan.fileSizeLimit !== -1) {
      updatedPlan.maxFileSizeMB = Math.floor(updatedPlan.fileSizeLimit / (1024 * 1024));
    } else {
      updatedPlan.maxFileSizeMB = -1;
    }

    res.json(updatedPlan);
  } catch (error) {
    console.error('Update plan config error:', error);
    res.status(500).json({ error: 'Failed to update plan config' });
  }
});

// System health
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

export default router;
