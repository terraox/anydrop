import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Verify email configuration on startup
// Verify email configuration on startup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify email configuration (non-blocking)
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service configuration error:', error.message);
    console.warn('⚠️  Email functionality may not work. Please check your EMAIL_* environment variables.');
  } else {
    console.log('✅ Email service ready');
  }
});

export const sendWelcomeEmail = async (email, username, accessKey) => {
  const mailOptions = {
    from: `AnyDrop <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to AnyDrop! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .access-key { background: #fff; border: 2px dashed #667eea; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
          .access-key-code { font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px; font-family: 'Courier New', monospace; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to AnyDrop! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${username},</p>
            <p>Your AnyDrop account has been created successfully! We're excited to have you on board.</p>
            
            <div class="access-key">
              <p><strong>Your Access Key:</strong></p>
              <div class="access-key-code">${accessKey}</div>
            </div>
            
            <p>Please use this access key to log in to your account. <strong>Keep this key safe and secure!</strong></p>
            
            <p>With AnyDrop, you can:</p>
            <ul>
              <li>Transfer files between your devices instantly</li>
              <li>Share files with others securely</li>
              <li>Access your transfer history</li>
            </ul>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <p>Happy transferring!<br>The AnyDrop Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    throw error;
  }
};

export const sendForgotPasswordEmail = async (email, code) => {
  const mailOptions = {
    from: `AnyDrop <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'AnyDrop - Password Reset Code 🔐',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .reset-code { background: #fff; border: 2px solid #667eea; padding: 30px; margin: 30px 0; text-align: center; border-radius: 8px; }
          .code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request 🔐</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You requested a password reset for your AnyDrop account. Use the verification code below to reset your password:</p>
            
            <div class="reset-code">
              <p style="margin: 0 0 10px 0; color: #666;">Your Reset Code:</p>
              <div class="code">${code}</div>
            </div>
            
            <div class="warning">
              <p style="margin: 0;"><strong>⚠️ Important:</strong> This code will expire in <strong>15 minutes</strong>.</p>
            </div>
            
            <p>If you didn't request this password reset, please ignore this email. Your account remains secure.</p>
            
            <p>For security reasons, never share this code with anyone.</p>
            
            <p>Best regards,<br>The AnyDrop Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>If you have concerns about your account security, please contact support immediately.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
};
