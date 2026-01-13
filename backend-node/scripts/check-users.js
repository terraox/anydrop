
import { User, Plan } from '../models/index.js';

const checkUsers = async () => {
    try {
        const users = await User.findAll({
            include: [{ model: Plan, as: 'plan' }],
            order: [['createdAt', 'DESC']]
        });

        console.log(`Total users found: ${users.length}`);
        users.forEach((u, i) => {
            console.log(`${i + 1}. ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Enabled: ${u.enabled}, CreatedAt: ${u.createdAt}, Plan: ${u.plan?.name || 'NULL'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUsers();
