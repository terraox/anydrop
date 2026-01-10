import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend-node directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

console.log('🔍 Testing email configuration...');
console.log(`📡 Host: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}`);
console.log(`📧 User: ${process.env.EMAIL_USER}`);

transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email service configuration error:', error.message);
        if (error.message.includes('535-5.7.8')) {
            console.error('\n📋 Authentication Failed Troubleshooting:');
            console.error('   1. For Gmail, you MUST use an App Password, not your regular password.');
            console.error('   2. Ensure 2-Factor Authentication is enabled on your Google account.');
            console.error('   3. Go to Security -> 2-Step Verification -> App passwords to create one.');
        }
        process.exit(1);
    } else {
        console.log('✅ Email service is ready to send emails!');

        // Attempt to send a test email to the same user
        const testMail = {
            from: `AnyDrop <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: 'AnyDrop - SMTP Test ✅',
            text: 'If you are reading this, AnyDrop email service is correctly configured!',
            html: '<b>If you are reading this, AnyDrop email service is correctly configured! ✅</b>'
        };

        console.log('✉️ Sending test email to', process.env.EMAIL_USER, '...');

        transporter.sendMail(testMail, (sendError, info) => {
            if (sendError) {
                console.error('❌ Failed to send test email:', sendError.message);
                process.exit(1);
            } else {
                console.log('✅ Test email sent successfully!');
                console.log('📧 Message ID:', info.messageId);
                process.exit(0);
            }
        });
    }
});
