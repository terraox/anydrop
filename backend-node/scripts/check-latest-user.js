import { User } from '../models/index.js';

const checkLatestUser = async () => {
    try {
        console.log('Connecting to DB...');
        const user = await User.findOne({
            order: [['createdAt', 'DESC']],
        });

        if (user) {
            console.log('Latest User:', {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                enabled: user.enabled,
                createdAt: user.createdAt
            });
        } else {
            console.log('No users found in database.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkLatestUser();
