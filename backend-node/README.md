# AnyDrop Backend - Node.js

Node.js backend for AnyDrop file transfer application.

## Features

- REST API for authentication, file management, device management
- WebSocket support for real-time file transfers
- JWT authentication
- PostgreSQL database with Sequelize ORM
- File upload/download
- Admin dashboard endpoints
- Rate limiting and security middleware

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the `backend-node` directory with the following variables:

```env
# Server
PORT=8080
NODE_ENV=development

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=anydrop
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_SSL=true

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRATION_MS=86400000

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=524288000
MAX_REQUEST_SIZE=524288000
UPLOAD_DIR=./uploads
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot` - Request password reset
- `POST /api/auth/forgot/verify` - Verify reset code
- `POST /api/auth/forgot/reset` - Reset password

### Files
- `POST /api/files/upload` - Upload file (requires auth)
- `GET /api/files/download/:filename` - Download file

### History
- `GET /api/history` - Get transfer history (requires auth)

### Identity & Devices
- `GET /api/identify` - Get server identity
- `GET /api/devices` - Get registered devices
- `PUT /api/device/name` - Update device name (requires auth)
- `GET /api/device/identity` - Get device identity (requires auth)

### Admin
- `GET /admin/dashboard/stats` - Dashboard statistics
- `GET /admin/users` - List users
- `POST /admin/users/:id/ban` - Ban user
- `POST /admin/users/:id/unban` - Unban user
- `GET /admin/files` - List files
- `GET /admin/coupons` - List coupons
- `POST /admin/coupons` - Create coupon
- `DELETE /admin/coupons/:id` - Delete coupon
- `GET /admin/health` - System health

## WebSocket Endpoints

### Transfer WebSocket (`/transfer`)
- `REGISTER` - Register device for transfers
- `TRANSFER_REQUEST` - Request file transfer
- `TRANSFER_RESPONSE` - Respond to transfer request
- `TRANSFER_FINISH` - Finish transfer
- `binary` - Binary data transfer

### Binary Stream WebSocket (`/stream`)
- `register` - Register as SENDER or RECEIVER
- `binary` - Stream binary data
- `START` - Start transfer signal

## Default Admin User

On first startup, a default admin user is created:
- Email: `admin@anydrop.com`
- Password: `admin123`

## Database

The application uses PostgreSQL with Sequelize ORM. Tables are automatically created on first run.

## Notes

- File uploads are stored in the `uploads/` directory (configurable via `UPLOAD_DIR`)
- JWT tokens expire after 24 hours by default
- Rate limiting: 100 requests per 15 minutes per IP
