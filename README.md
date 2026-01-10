# AnyDrop - File Transfer Application

A modern file transfer application with cross-platform support (Web, Desktop, Mobile).

## Project Structure

```
anydrop/
├── frontend/          # React + Vite frontend
├── backend-node/      # Node.js backend (Express + Socket.io) - ACTIVE
├── mobile-app/        # Flutter mobile app
└── landing-page/     # Landing page (optional)
```

**Note:** The `backend/` folder (Java/Spring Boot) is legacy and not actively used. All backend functionality is in `backend-node/`. The `backend/target/` directory is ignored by `.gitignore`.

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

Install all dependencies (root, backend, and frontend):

```bash
npm run install:all
```

Or install individually:

```bash
# Root dependencies
npm install

# Backend dependencies
cd backend-node && npm install

# Frontend dependencies
cd frontend && npm install
```

### Development

Start both backend and frontend in development mode:

```bash
npm run dev
```

This will start:
- **Backend** on `http://localhost:8080`
- **Frontend** on `http://localhost:5173` (Vite default port)

### Individual Commands

Start only backend:
```bash
npm run dev:backend
# or
cd backend-node && npm run dev
```

Start only frontend:
```bash
npm run dev:frontend
# or
cd frontend && npm run dev
```

### Production

Build frontend:
```bash
npm run build
```

Start production servers:
```bash
npm start
```

## Backend Configuration

The backend requires a `.env` file in `backend-node/` directory. See `backend-node/README.md` for details.

Default configuration:
- Backend: `http://localhost:8080`
- Frontend: `http://localhost:5173`

## Features

- 🔐 JWT Authentication
- 📁 File Upload/Download
- 🔄 Real-time file transfers via WebSocket
- 📱 Cross-platform support
- 👥 Multi-device discovery
- 🎛️ Admin dashboard
- 📊 Transfer history

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend (Node.js)
- Express.js
- Socket.io
- Sequelize ORM
- PostgreSQL
- JWT Authentication

## Default Admin Credentials

- Email: `admin@anydrop.com`
- Password: `admin123`

## License

ISC
