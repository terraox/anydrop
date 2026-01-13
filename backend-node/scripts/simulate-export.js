
import { User, Plan, sequelize } from '../models/index.js';

const simulateExport = async () => {
    try {
        const users = await User.findAll({
            include: [{ model: Plan, as: 'plan' }],
            order: [['createdAt', 'DESC']]
        });

        const data = users;
        const headers = ['ID', 'Username', 'Email', 'Role', 'Plan', 'Status', 'Joined'];
        const csvRows = [
            headers.join(','),
            ...data.map(u => [
                u.id,
                `"${u.username || u.email.split('@')[0]}"`,
                `"${u.email}"`,
                (u.role === 'ROLE_ADMIN' || u.role === 'ADMIN') ? 'ADMIN' : 'USER',
                u.plan?.name || 'FREE',
                u.enabled ? 'Active' : 'Banned',
                u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : 'Just now'
            ].join(','))
        ];

        console.log('--- GENERATED CSV ---');
        console.log(csvRows.join('\n'));
        console.log('--- END CSV ---');
        console.log(`Total rows (including header): ${csvRows.length}`);

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

simulateExport();
