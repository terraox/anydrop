
import { User, Plan, sequelize } from '../models/index.js';

const diagnostic = async () => {
    try {
        const users = await User.findAll({
            include: [{ model: Plan, as: 'plan' }],
            order: [['id', 'ASC']]
        });

        console.log(`Diagnostic for ${users.length} users:`);
        users.forEach(u => {
            console.log(`--- User ID: ${u.id} ---`);
            console.log(`Email: ${u.email}`);
            console.log(`Username: ${u.username}`);
            console.log(`Role: ${u.role}`);
            console.log(`Enabled: ${u.enabled}`);
            console.log(`CreatedAt: ${u.createdAt}`);
            console.log(`Plan: ${u.plan ? u.plan.name : 'NULL'}`);

            // Test the CSV mapping logic
            try {
                const csvRow = [
                    u.id,
                    `"${u.username || u.email.split('@')[0]}"`,
                    `"${u.email}"`,
                    (u.role === 'ROLE_ADMIN' || u.role === 'ADMIN') ? 'ADMIN' : 'USER',
                    u.plan?.name || 'FREE',
                    u.enabled ? 'Active' : 'Banned',
                    u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : 'N/A'
                ].join(',');
                console.log(`CSV Row Test: SUCCESS`);
            } catch (e) {
                console.log(`CSV Row Test: FAILED (${e.message})`);
            }
        });

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

diagnostic();
