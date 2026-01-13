import { verifyToken } from '../services/jwtService.js';
import { User } from '../models/index.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await User.findByPk(decoded.id, {
      include: [{ model: (await import('../models/index.js')).Plan, as: 'plan' }]
    });

    if (!user || !user.enabled) {
      return res.status(401).json({ error: 'User not found or disabled' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'ROLE_ADMIN' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
