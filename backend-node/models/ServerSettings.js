import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ServerSettings = sequelize.define('ServerSettings', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'server_settings',
  timestamps: true
});

export default ServerSettings;
