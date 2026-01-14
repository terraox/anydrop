import { Coupon } from '../models/index.js';
import { sequelize } from '../models/index.js';

const checkCoupons = async () => {
    try {
        console.log("🔌 Connecting to DB...");
        await sequelize.authenticate();
        console.log("✅ DB Connected.");

        console.log("Fetching coupons...");
        try {
            const coupons = await Coupon.findAll();
            console.log("Coupons found:", coupons.length);
            console.log(JSON.stringify(coupons, null, 2));
        } catch (dbError) {
            console.error("❌ findAll failed. Table might cause issue:", dbError.original || dbError.message);
        }

        console.log("Attempting to create a test coupon...");
        try {
            const newCoupon = await Coupon.create({
                code: `TEST_${Date.now()}`,
                discount: 10,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 86400000),
                usageLimit: 1
            });
            console.log("✅ Coupon created:", newCoupon.toJSON());

            console.log("Deleting test coupon...");
            await newCoupon.destroy();
            console.log("✅ Deleted.");
        } catch (createError) {
            console.error("❌ Create failed:", createError.original || createError.message);
        }

    } catch (e) {
        console.error("❌ General Error:", e);
    }
    process.exit(0);
};

checkCoupons();
