# Email Setup Guide

## Configuration

Email functionality is configured via environment variables in `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Gmail Setup

If using Gmail, you need to:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to Google Account → Security
   - Under "2-Step Verification", click "App passwords"
   - Generate a new app password for "Mail"
   - Use this 16-character password as `EMAIL_PASS`

## Email Templates

The backend includes two email templates:

### 1. Welcome Email
- Sent when a new user registers
- Contains the user's access key
- Professional HTML template with styling

### 2. Password Reset Email
- Sent when user requests password reset
- Contains a 6-digit verification code
- Code expires in 15 minutes
- Professional HTML template with security warnings

## Testing Email

To test if email is working:

1. Start the backend server
2. Check console for: `✅ Email service ready`
3. Register a new user or request password reset
4. Check your email inbox

## Troubleshooting

### "Email service configuration error"
- Check that `EMAIL_USER` and `EMAIL_PASS` are set correctly
- For Gmail, ensure you're using an App Password, not your regular password
- Verify SMTP settings match your email provider

### Emails not sending
- Check server logs for specific error messages
- Verify network connectivity
- Some email providers may block automated emails (check spam folder)

### Gmail "Less secure app" error
- Gmail no longer supports "less secure apps"
- You MUST use an App Password (see Gmail Setup above)
