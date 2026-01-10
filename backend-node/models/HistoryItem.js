import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HistoryItem = sequelize.define('HistoryItem', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  direction: {
    type: DataTypes.STRING, // 'upload', 'download', 'send', 'receive'
    allowNull: false
  },
  status: {
    type: DataTypes.STRING, // 'completed', 'failed', 'pending'
    defaultValue: 'completed'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'history_items',
  timestamps: true,
  updatedAt: false
});

export default HistoryItem;
