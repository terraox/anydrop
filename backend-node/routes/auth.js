import express from 'express';
import { User, Plan, ResetToken } from '../models/index.js';
import { generateToken } from '../services/jwtService.js';
import { sendWelcomeEmail, sendForgotPasswordEmail } from '../services/emailService.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Generate access key
const generateAccessKey = () => {
  const adjectives = ['happy', 'bright', 'swift', 'calm', 'bold', 'wise', 'keen', 'cool', 'fast', 'smart',
    'brave', 'clear', 'fresh', 'grand', 'quick', 'sharp', 'solid', 'sweet', 'warm', 'wild'];
  const nouns = ['dolphin', 'eagle', 'tiger', 'ocean', 'river', 'mountain', 'forest', 'cloud', 'star', 'moon',
    'sun', 'wave', 'breeze', 'crystal', 'flame', 'storm', 'light', 'shadow', 'spark', 'pearl'];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 99) + 1;

  return `${adjective}-${noun}-${number}`;
};

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email: email.trim() } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Get default plan (SCOUT)
    let plan = await Plan.findOne({ where: { name: 'SCOUT' } });
    if (!plan) {
      plan = await Plan.create({
        name: 'SCOUT',
        speedLimit: 500000,
        fileSizeLimit: 50000000
      });
    }

    // Generate access key
    const accessKey = generateAccessKey();
    console.log(`Generated access key for ${email}: ${accessKey}`);

    // Create user
    const user = await User.create({
      username: username || email.split('@')[0],
      email: email.trim(),
      password: accessKey, // Will be hashed by hook
      role: 'ROLE_USER',
      planId: plan.id
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.username, accessKey)
      .then(() => {
        console.log(`✅ Welcome email queued for ${user.email}`);
      })
      .catch((emailError) => {
        console.error(`❌ Failed to send welcome email to ${user.email}:`, emailError.message);
        // Continue even if email fails - user can still use the app
      });

    // Generate token
    const token = generateToken(user);

    res.json({ token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Find user
    const user = await User.findOne({
      where: { email: email.trim() },
      include: [{ model: Plan, as: 'plan' }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is enabled
    if (!user.enabled) {
      return res.status(403).json({ error: 'Your account is banned. Please contact the administrator at admin@anydrop.com.' });
    }

    if (!user.accountNonLocked) {
      return res.status(403).json({ error: 'Your account is banned. Please contact the administrator at admin@anydrop.com.' });
    }

    // Verify password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user);

    // Build response
    const displayUsername = user.email.split('@')[0];
    const avatarSeed = displayUsername.replace(/[^a-zA-Z0-9]/g, '');
    let frontendRole = user.role;
    if (frontendRole === 'ROLE_ADMIN') {
      frontendRole = 'ADMIN';
    } else if (frontendRole?.startsWith('ROLE_')) {
      frontendRole = frontendRole.substring(5);
    }

    res.json({
      token,
      email: user.email,
      role: frontendRole,
      plan: user.plan ? user.plan.name : 'SCOUT',
      username: displayUsername,
      avatar: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${avatarSeed}`
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Forgot password
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email: email.trim() } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove previous tokens
    await ResetToken.destroy({ where: { userId: user.id } });

    // Generate 6-digit code
    const code = String(Math.floor(Math.random() * 999999)).padStart(6, '0');

    // Create reset token
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await ResetToken.create({
      userId: user.id,
      code,
      expiresAt,
      used: false
    });

    // Send email (non-blocking, but we'll wait for it)
    try {
      await sendForgotPasswordEmail(user.email, code);
      console.log(`✅ Password reset email sent to ${user.email}`);
      res.json({ message: 'Reset code sent' });
    } catch (emailError) {
      console.error(`❌ Failed to send password reset email to ${user.email}:`, emailError.message);
      // Still return success to prevent email enumeration, but log the error
      res.json({ message: 'Reset code sent' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Verify code
router.post('/forgot/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ where: { email: email.trim() } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = await ResetToken.findOne({
      where: {
        userId: user.id,
        code,
        used: false,
        expiresAt: { [require('sequelize').Op.gt]: new Date() }
      },
      order: [['createdAt', 'DESC']]
    });

    if (!token) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    res.json({ message: 'Code verified' });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

// Reset password
router.post('/forgot/reset', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ where: { email: email.trim() } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = await ResetToken.findOne({
      where: {
        userId: user.id,
        code,
        used: false,
        expiresAt: { [require('sequelize').Op.gt]: new Date() }
      },
      order: [['createdAt', 'DESC']]
    });

    if (!token) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    // Mark token as used
    token.used = true;
    await token.save();

    // Update password (will be hashed by hook)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Change password (authenticated users)
router.post('/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Email, current password, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findOne({ where: { email: email.trim() } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password (will be hashed by hook)
    user.password = newPassword;
    await user.save();

    console.log(`✅ Password changed for ${email}`);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;

