import { User, Plan } from '../models/index.js';
import { Op } from 'sequelize';

const debugFetch = async () => {
    try {
        console.log('Simulating Admin User Fetch...');

        const search = '';
        const status = 'active';
        const page = 0;
        const size = 20;

        const offset = parseInt(page) * parseInt(size);
        const limit = parseInt(size);

        const where = {};
        if (search) {
            where[Op.or] = [
                { email: { [Op.iLike]: `%${search}%` } },
                { username: { [Op.iLike]: `%${search}%` } }
            ];
        }
        if (status === 'banned') {
            where.enabled = false;
        } else if (status === 'active') {
            where.enabled = true;
        }

        console.log('Query Params:', { where, limit, offset });

        const { count, rows } = await User.findAndCountAll({
            where,
            include: [{ model: Plan, as: 'plan' }],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        console.log('Result Count:', count);
        console.log('Rows Length:', rows.length);

        if (rows.length > 0) {
            console.log('First User:', {
                id: rows[0].id,
                email: rows[0].email,
                role: rows[0].role,
                enabled: rows[0].enabled,
                createdAt: rows[0].createdAt
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Error debugging fetch:', error);
        process.exit(1);
    }
};

debugFetch();
