import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DeviceInfo = sequelize.define('DeviceInfo', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  deviceId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  deviceName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  deviceType: {
    type: DataTypes.STRING, // 'laptop', 'desktop', 'mobile', etc.
    allowNull: true
  },
  deviceIcon: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  lastSeen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'device_info',
  timestamps: true
});

export default DeviceInfo;
