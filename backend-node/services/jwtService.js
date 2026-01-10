import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION_MS = parseInt(process.env.JWT_EXPIRATION_MS || '86400000');

export const generateToken = (user) => {
  const payload = {
    sub: user.email,
    email: user.email,
    role: user.role,
    id: user.id
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION_MS / 1000 // Convert to seconds
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const extractUsername = (token) => {
  const decoded = verifyToken(token);
  return decoded ? decoded.sub : null;
};
