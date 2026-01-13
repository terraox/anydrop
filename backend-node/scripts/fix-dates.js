import { User, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

const fixNullDates = async () => {
    try {
        console.log('Fixing null createdAt dates...');

        // Find users with null createdAt
        const users = await User.findAll({
            where: {
                createdAt: null
            }
        });

        console.log(`Found ${users.length} users with null createdAt.`);

        if (users.length > 0) {
            // Update them to NOW
            await User.update({
                createdAt: new Date()
            }, {
                where: {
                    createdAt: null
                }
            });
            console.log('Updated users with current timestamp.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error fixing dates:', error);
        process.exit(1);
    }
};

fixNullDates();
