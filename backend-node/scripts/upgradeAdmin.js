import { User, Plan } from '../models/index.js';
import sequelize from '../config/database.js';

/**
 * Upgrade a user to PRO plan
 * Usage: node scripts/upgradeAdmin.js <email>
 */

const upgradeUserToPro = async (email) => {
    try {
        if (!email) {
            console.error('❌ Error: Email is required');
            console.log('Usage: node scripts/upgradeAdmin.js <email>');
            process.exit(1);
        }

        // Find the PRO plan
        const proPlan = await Plan.findOne({ where: { name: 'PRO' } });

        if (!proPlan) {
            console.error('❌ Error: PRO plan not found in database');
            process.exit(1);
        }

        // Find the user
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.error(`❌ Error: User with email ${email} not found`);
            process.exit(1);
        }

        // Check if already PRO
        if (user.planId === proPlan.id) {
            console.log(`✅ User ${email} is already on PRO plan`);
            process.exit(0);
        }

        // Update user's plan
        user.planId = proPlan.id;
        await user.save();

        console.log(`✅ Successfully upgraded ${email} to PRO plan`);
        console.log(`   Plan ID: ${proPlan.id}`);
        console.log(`   User ID: ${user.id}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error upgrading user:', error.message);
        process.exit(1);
    }
};

// Get email from command line arguments
const email = process.argv[2];

// Run the upgrade
upgradeUserToPro(email);
