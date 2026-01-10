import sequelize from '../config/database.js';
import User from './User.js';
import Plan from './Plan.js';
import HistoryItem from './HistoryItem.js';
import ResetToken from './ResetToken.js';
import Coupon from './Coupon.js';
import Transaction from './Transaction.js';
import ServerSettings from './ServerSettings.js';
import DeviceInfo from './DeviceInfo.js';

// Define associations
User.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });
Plan.hasMany(User, { foreignKey: 'planId', as: 'users' });

HistoryItem.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(HistoryItem, { foreignKey: 'userId', as: 'historyItems' });

ResetToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(ResetToken, { foreignKey: 'userId', as: 'resetTokens' });

Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });

export {
  sequelize,
  User,
  Plan,
  HistoryItem,
  ResetToken,
  Coupon,
  Transaction,
  ServerSettings,
  DeviceInfo
};
