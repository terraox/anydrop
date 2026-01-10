import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Plan = sequelize.define('Plan', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  speedLimit: {
    type: DataTypes.BIGINT,
    defaultValue: -1 // -1 means unlimited
  },
  fileSizeLimit: {
    type: DataTypes.BIGINT,
    defaultValue: -1 // -1 means unlimited
  }
}, {
  tableName: 'plans',
  timestamps: false
});

export default Plan;
