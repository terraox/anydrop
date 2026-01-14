import sequelize from '../config/database.js';
import { User } from '../models/index.js';

/**
 * Add dailyTransferCount and lastTransferResetDate columns to users table
 * Run this once: node scripts/migrateUserColumns.js
 */

const migrateUserColumns = async () => {
    try {
        console.log('🔄 Starting migration: Adding transfer tracking columns to users table...');

        // Add dailyTransferCount column
        await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS "dailyTransferCount" INTEGER DEFAULT 0;
    `);
        console.log('✅ Added dailyTransferCount column');

        // Add lastTransferResetDate column
        await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS "lastTransferResetDate" DATE;
    `);
        console.log('✅ Added lastTransferResetDate column');

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
};

migrateUserColumns();
