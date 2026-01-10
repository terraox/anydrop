import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { HistoryItem, User } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '524288000') // 500MB default
  }
});

export const storeFile = async (file, user) => {
  try {
    const historyItem = await HistoryItem.create({
      userId: user ? user.id : null,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      filePath: file.path,
      direction: 'upload',
      status: 'completed'
    });

    return historyItem;
  } catch (error) {
    console.error('Error storing file:', error);
    throw error;
  }
};

export const getFile = async (filename) => {
  const filePath = path.join(uploadDir, filename);
  
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }

  return filePath;
};
