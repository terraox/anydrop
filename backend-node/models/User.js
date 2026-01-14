import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deviceName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deviceIcon: {
    type: DataTypes.STRING,
    allowNull: true
  },
  planId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'plans',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'ROLE_USER',
    allowNull: false
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  accountNonLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  accountNonExpired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  credentialsNonExpired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  dailyTransferCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastTransferResetDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  updatedAt: false,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default User;
