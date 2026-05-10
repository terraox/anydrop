






# AnyDrop - File Transfer Application

> A modern, cross-platform file transfer application that enables seamless, peer-to-peer file sharing across devices on a local network — without cloud intermediaries.

## Project Demo
<video src="https://github.com/user-attachments/assets/4d66b0f2-f117-4df3-b6ff-924ad848cc66" width="100%" controls></video>

## Live Landing Page
Check out the live landing page here:
[AnyDrop Landing Page](https://anydrop-i5hx45ief-aadityabasisths-projects.vercel.app/)

#### Landing Page Live Preview
<video src="https://github.com/user-attachments/assets/ff6472a0-baf7-4dc0-bef4-7f8056e05959" width="100%" controls></video>

## Features
-  **Zero-config device discovery** via mDNS/Bonjour on local network
-  **Real-time transfer signaling** via plain WebSocket (`/ws` endpoint)
-  **Raw streaming uploads** — no multipart encoding overhead (`req.pipe(out)`)
-  **Cross-platform** — works between phone and any browser
-  **JWT-based auth** for the web dashboard
-  **Admin panel** with user management, plans, and coupons
-  **Transfer history** tracking per user

## Quick Start & Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation
Install all dependencies (root, backend, and frontend):
```bash
npm run install:all
```
Or individually:
```bash
npm install
cd backend-node && npm install
cd ../frontend && npm install
```

### Development
Start both backend and frontend:
```bash
npm run dev
```

## System Architecture

AnyDrop connects devices via local network using mDNS for discovery and WebSockets for transfer signaling. The actual file transfer happens via raw HTTP streaming for maximum performance.

```text
┌─────────────────────────────────────────────────────────┐
│                     LOCAL NETWORK                       │
│                                                         │
│  ┌──────────────┐    mDNS/Bonjour    ┌───────────────┐  │
│  │ Flutter App  │◄──────────────────►│ Node.js Server│  │
│  │ (Mobile)     │                    │ (Desktop)     │  │
│  └──────┬───────┘                    └───────┬───────┘  │
│         │  WebSocket (/ws) signaling         │          │
│         │◄──────────────────────────────────►│          │
│         │  RAW HTTP POST /upload             │          │
│         │───────────────────────────────────►│          │
│                                              │          │
│                                     ┌────────▼────────┐ │
│                                     │  React Frontend │ │
│                                     │  (Web Browser)  │ │
│                                     └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack
- **Web Frontend:** React 18, Vite, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express.js, WebSocket (ws), Sequelize, PostgreSQL
- **Mobile App:** Flutter
- **Landing Page:** Next.js 16

## Default Admin Credentials
- Email: `admin@anydrop.com`
- Password: `admin123`

