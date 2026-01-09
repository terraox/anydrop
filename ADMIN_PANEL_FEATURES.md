# Admin Panel Features Analysis

## Overview
The admin panel has 7 main sections with the following features:

---

## 1. **Admin Dashboard** (`/admin/dashboard`)
### Features:
- **Metrics Display:**
  - Total Users (with growth percentage)
  - Active Transfers (currently in progress)
  - Storage Used (with progress bar)
  - Bandwidth Today (with peak rate)
  
- **Charts:**
  - Files Transferred (Last 7 Days) - Bar chart
  
- **Recent Activity Feed:**
  - New user registrations
  - File transfer completions
  - Plan activations
  - Large file uploads
  
- **Quick Actions:**
  - Links to Users, Files, Plans, System Health pages

### Backend Requirements:
- GET `/admin/dashboard/stats` - Get dashboard metrics
- GET `/admin/dashboard/activity` - Get recent activity logs
- GET `/admin/dashboard/transfers-chart` - Get transfer data for chart (last 7 days)

---

## 2. **Users Management** (`/admin/users`)
### Features:
- **User List Table:**
  - User info (avatar, username, email)
  - Role (ADMIN/USER)
  - Plan (FREE/PRO)
  - Storage used
  - Join date
  - Status (active/banned)
  
- **Search Functionality:**
  - Search by email or username
  
- **Filtering:**
  - Active Users tab
  - Banned Users tab
  
- **Actions:**
  - Ban/Unban user
  - Export to CSV
  
### Backend Requirements:
- GET `/admin/users` - List all users (with pagination, search, filter)
- POST `/admin/users/{id}/ban` - Ban a user
- POST `/admin/users/{id}/unban` - Unban a user
- GET `/admin/users/export` - Export users to CSV

---

## 3. **Files Management** (`/admin/files`)
### Features:
- **Storage Overview:**
  - Total storage used vs available
  - Storage breakdown by type (Documents, Media, Other)
  - Progress bar
  
- **Quick Stats:**
  - Total Files
  - Transfers Today
  - Average File Size
  
- **File Transfer Logs Table:**
  - File name with icon
  - File size
  - Sender email
  - Receiver email
  - Transfer date
  
- **Search Functionality:**
  - Search by file name, sender, or receiver
  
- **Actions:**
  - Download file
  - Delete file
  
### Backend Requirements:
- GET `/admin/files/stats` - Get storage statistics
- GET `/admin/files` - List file transfers (with pagination, search)
- GET `/admin/files/{id}/download` - Download a file
- DELETE `/admin/files/{id}` - Delete a file

---

## 4. **Plans & Configuration** (`/admin/plans`)
### Features:
- **Free Tier Configuration:**
  - Max File Size (MB) - editable
  - Daily Transfer Limit - editable
  - Storage Limit (GB) - editable
  
- **Pro Tier Configuration:**
  - Max File Size (MB) - editable
  - Daily Transfer Limit - "Unlimited" (disabled)
  - Storage Limit (GB) - editable
  - Priority Processing - toggle switch
  
- **Save Changes Button:**
  - Saves all plan configurations
  
### Backend Requirements:
- GET `/admin/plans/config` - Get current plan configurations
- PUT `/admin/plans/config` - Update plan configurations

---

## 5. **Coupons Management** (`/admin/coupons`)
### Features:
- **Coupon List Table:**
  - Coupon code
  - Discount percentage
  - Plan type (PRO)
  - Usage count (current/max)
  - Expiry date
  - Status (ACTIVE/EXPIRED/LIMIT REACHED)
  
- **Create Coupon Modal:**
  - Code (uppercase)
  - Discount percentage
  - Plan type
  - Max uses
  - Expiry date
  
- **Actions:**
  - Create new coupon
  - Delete coupon
  
### Backend Requirements:
- GET `/admin/coupons` - List all coupons
- POST `/admin/coupons` - Create new coupon
- DELETE `/admin/coupons/{id}` - Delete coupon

### New Model Needed:
- `Coupon` entity with fields: id, code, discountPercent, planType, maxUses, currentUses, expiryDate, createdAt

---

## 6. **Transactions** (`/admin/transactions`)
### Features:
- **Revenue Statistics:**
  - Total Revenue (with growth percentage)
  - Successful transactions count
  - Failed transactions count
  
- **Transaction List Table:**
  - User email
  - Amount (₹)
  - Plan (PRO)
  - Payment method (UPI, Card, NetBanking)
  - Date
  - Status (completed/failed/refunded)
  
- **Search Functionality:**
  - Search by user email
  
### Backend Requirements:
- GET `/admin/transactions/stats` - Get transaction statistics
- GET `/admin/transactions` - List all transactions (with pagination, search)

### New Model Needed:
- `Transaction` entity with fields: id, user, amount, plan, paymentMethod, status, createdAt

---

## 7. **System Health** (`/admin/health`)
### Features:
- **System Metrics:**
  - CPU Usage (with progress bar)
  - Memory Usage (with progress bar)
  - Disk Usage (with progress bar)
  - Active Connections (WebSocket)
  - API Latency
  - System Uptime
  
- **Service Status:**
  - API Server (status, uptime %)
  - Database (status, uptime %)
  - File Storage (status, uptime %)
  - WebSocket Server (status, uptime %)
  - Background Jobs (status, uptime %)
  
### Backend Requirements:
- GET `/admin/health` - Get system health metrics
- GET `/admin/health/services` - Get service status

---

## Summary of Backend Implementation Needed:

### New Models:
1. `Coupon` - For discount codes
2. `Transaction` - For payment records
3. `ActivityLog` - For recent activity tracking (optional, can use existing HistoryItem)

### New Repositories:
1. `CouponRepository`
2. `TransactionRepository`

### Enhanced AdminController:
- Dashboard endpoints
- Users management endpoints (enhance existing)
- Files management endpoints
- Plans configuration endpoints
- Coupons management endpoints
- Transactions endpoints
- System health endpoints

### Services:
- `AdminService` - Business logic for admin operations
- `SystemHealthService` - System metrics collection
