
import { User } from '../models/index.js';
import { sequelize } from '../models/index.js';

const checkStatusCounts = async () => {
    try {
        const total = await User.count();
        const active = await User.count({ where: { enabled: true } });
        const banned = await User.count({ where: { enabled: false } });
        const nullEnabled = await User.count({ where: { enabled: null } });

        console.log(`Total Users: ${total}`);
        console.log(`Active Users: ${active}`);
        console.log(`Banned Users: ${banned}`);
        console.log(`Null Enabled: ${nullEnabled}`);

        const allUsers = await User.findAll({ attributes: ['id', 'email', 'enabled', 'role'] });
        console.log('\nAll Users:');
        allUsers.forEach(u => {
            console.log(`- ID: ${u.id}, Email: ${u.email}, Enabled: ${u.enabled}, Role: ${u.role}`);
        });

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkStatusCounts();
