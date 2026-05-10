# AnyDrop — Technical Project Overview

> A modern, cross-platform file transfer application that enables seamless, peer-to-peer file sharing across devices on a local network — without cloud intermediaries.

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack at a Glance](#3-tech-stack-at-a-glance)
4. [Backend Dependencies (Node.js)](#4-backend-dependencies-nodejs)
5. [Frontend Dependencies (React + Vite)](#5-frontend-dependencies-react--vite)
6. [Mobile App Dependencies (Flutter)](#6-mobile-app-dependencies-flutter)
7. [Landing Page Dependencies (Next.js)](#7-landing-page-dependencies-nextjs)
8. [Core Concepts](#8-core-concepts)
9. [How File Transfer Works — End to End](#9-how-file-transfer-works--end-to-end)
10. [Database Models](#10-database-models)
11. [FAQ — For Technical Interviews](#11-faq--for-technical-interviews)

---

## 1. Project Summary

**AnyDrop** is a **local-network, peer-to-peer file transfer system** inspired by Apple's AirDrop — but cross-platform. It allows a desktop (running the web frontend + Node.js backend) and a mobile device (running the Flutter app) to discover each other, negotiate a transfer, and send files directly via raw HTTP streaming over the local network.

### Platform Coverage

| Platform | Technology | Role |
|---|---|---|
| **Web Frontend** | React 18 + Vite | Desktop web UI for sending/receiving files |
| **Backend** | Node.js + Express | REST API, WebSocket signaling, mDNS advertising |
| **Mobile App** | Flutter | Cross-platform iOS/Android companion app |
| **Landing Page** | Next.js 16 | Marketing/product page |

### Key Capabilities

- 🔍 **Zero-config device discovery** via mDNS/Bonjour on local network
- 📡 **Real-time transfer signaling** via plain WebSocket (`/ws` endpoint)
- 🚀 **Raw streaming uploads** — no multipart encoding overhead (`req.pipe(out)`)
- 📱 **Cross-platform** — works between phone and any browser
- 🔐 **JWT-based auth** for the web dashboard
- 🎛️ **Admin panel** with user management, plans, and coupons
- 📊 **Transfer history** tracking per user

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     LOCAL NETWORK                        │
│                                                          │
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
│                                     │  React Frontend  │ │
│                                     │  (Web Browser)   │ │
│                                     └─────────────────┘ │
└─────────────────────────────────────────────────────────┘

External:

┌──────────────┐
│  Next.js     │  (Landing Page — deployed separately, e.g. Vercel)
│  Landing Page│
└──────────────┘

┌──────────────┐
│  PostgreSQL  │  (Persistent data: users, history, plans, coupons)
└──────────────┘
```

### Communication Channels

| Channel | Protocol | Purpose |
|---|---|---|
| `/ws` WebSocket | Plain WebSocket (`ws` library) | Transfer signaling (metadata, ACCEPT, REJECT, PROGRESS) |
| Socket.IO | WebSocket / polling | Legacy STOMP-based communication |
| `/upload` | HTTP POST (raw stream) | Actual file binary data transfer |
| `/api/*` | HTTP REST | Auth, history, device info, admin operations |
| mDNS/Bonjour | UDP multicast (ZeroConf) | Device discovery on local network |

---

## 3. Tech Stack at a Glance

| Layer | Technology | Version |
|---|---|---|
| Backend Runtime | Node.js | v18+ |
| Backend Framework | Express.js | 4.x |
| Database | PostgreSQL | — |
| ORM | Sequelize | 6.x |
| Real-time Signaling | Socket.IO + `ws` | 4.x / 8.x |
| Authentication | JWT (jsonwebtoken) | 9.x |
| Device Discovery | Bonjour/mDNS (`bonjour-service`) | 1.x |
| Frontend Framework | React | 18.x |
| Frontend Build Tool | Vite | 7.x |
| Frontend Styling | Tailwind CSS | 3.x |
| Animations | Framer Motion | 12.x |
| Mobile Framework | Flutter (Dart) | SDK ^3.10.0 |
| Mobile State Mgmt | Provider | 6.x |
| Landing Page | Next.js | 16.x |
| Landing Page Lang | TypeScript | 5.x |

---

## 4. Backend Dependencies (Node.js)

Located in `backend-node/package.json`.

### Production Dependencies

| Package | Version | Purpose |
|---|---|---|
| `express` | ^4.18.2 | Core HTTP server framework — handles all REST routes and middleware |
| `socket.io` | ^4.6.1 | WebSocket server with fallback to HTTP polling; used for STOMP-based legacy transfer signaling |
| `ws` | ^8.16.0 | Lightweight plain WebSocket server; powers the `/ws` signaling channel for real-time transfer control messages |
| `sequelize` | ^6.35.2 | ORM for PostgreSQL — defines models, runs migrations, handles queries |
| `pg` | ^8.11.3 | PostgreSQL driver; the underlying database adapter used by Sequelize |
| `jsonwebtoken` | ^9.0.2 | Signs and verifies JWT tokens for user authentication and route protection |
| `bcryptjs` | ^2.4.3 | Hashes user passwords before storing in the database; compares on login |
| `bonjour-service` | ^1.3.0 | Implements mDNS/Bonjour protocol for zero-config device advertising and discovery on LAN |
| `cors` | ^2.8.5 | Adds Cross-Origin Resource Sharing headers to allow frontend (different port) to call the API |
| `dotenv` | ^16.3.1 | Loads environment variables from `.env` file into `process.env` |
| `express-rate-limit` | ^7.1.5 | Protects all routes from abuse; limits to 100 requests per 15-minute window |
| `express-validator` | ^7.0.1 | Validates incoming request body fields (email format, required fields, etc.) |
| `multer` | ^1.4.5-lts.1 | Multipart form-data file upload middleware (used for profile pictures / non-streaming uploads) |
| `busboy` | ^1.6.0 | Low-level streaming parser for multipart form data (installed but primary upload uses raw `req.pipe()`) |
| `nodemailer` | ^6.9.7 | Sends transactional emails — password reset links, OTP verification, welcome emails |
| `mime-types` | ^2.1.35 | Maps file extensions to MIME types for correct `Content-Type` headers on download |
| `uuid` | ^9.0.1 | Generates RFC 4122 compliant unique IDs for transfers, devices, and database records |

### Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| `nodemon` | ^3.0.2 | Auto-restarts the Node server whenever source files change during development |

---

## 5. Frontend Dependencies (React + Vite)

Located in `frontend/package.json`.

### Production Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | ^18.3.1 | Core UI library; component model, hooks, virtual DOM rendering |
| `react-dom` | ^18.3.1 | Renders React component tree to the browser DOM |
| `react-router-dom` | ^7.10.1 | Client-side routing — manages page navigation without full-page reloads |
| `axios` | ^1.13.2 | Promise-based HTTP client for calling backend REST APIs with interceptors for auth headers |
| `framer-motion` | ^12.23.26 | Production-grade animation library; powers drag gestures, enter/exit transitions, and layout animations |
| `react-dropzone` | ^14.3.8 | Drag-and-drop file selection zone component with file validation hooks |
| `lucide-react` | ^0.559.0 | Tree-shakeable SVG icon library (clean, consistent icon set) |
| `sonner` | ^2.0.7 | Opinionated, accessible toast notification system |
| `next-themes` | ^0.4.6 | System-aware dark/light theme provider with no flash-of-unstyled-content |
| `@stomp/stompjs` | ^7.2.1 | STOMP protocol client over WebSocket; used for legacy Socket.IO channel messaging |
| `sockjs-client` | ^1.6.1 | SockJS transport fallback client (pairs with `@stomp/stompjs` for environments without native WS) |
| `canvas-confetti` | ^1.9.4 | Renders confetti particle animation on successful file transfers |
| `class-variance-authority` | ^0.7.1 | Type-safe component variant API — used to build structured component style variants |
| `clsx` | ^2.1.1 | Conditionally joins CSS class names; avoids messy string concatenation |
| `tailwind-merge` | ^3.4.0 | Intelligently merges Tailwind CSS classes without conflicts |
| `tailwindcss-animate` | ^1.0.7 | Tailwind plugin adding CSS keyframe animation utilities |
| `cmdk` | ^1.1.1 | Accessible command-palette/search component |
| `cva` | ^0.0.0 | Class Variance Authority alias/extra dependency |

### Dev Dependencies

| Package | Purpose |
|---|---|
| `vite` | Lightning-fast development server and bundler using native ES Modules |
| `@vitejs/plugin-react` | Official Vite plugin for React — handles JSX transform, Fast Refresh |
| `tailwindcss` | Utility-first CSS framework |
| `postcss` | CSS post-processor (required by Tailwind) |
| `autoprefixer` | PostCSS plugin that automatically adds vendor prefixes for browser compatibility |

---

## 6. Mobile App Dependencies (Flutter)

Located in `mobile-app/pubspec.yaml`.

### Dependencies

| Package | Version | Purpose |
|---|---|---|
| `provider` | ^6.1.1 | InheritedWidget-based state management; propagates app state (device info, transfer status) down the widget tree |
| `web_socket_channel` | ^3.0.0 | Dart WebSocket client for connecting to the backend `/ws` signaling channel |
| `stomp_dart_client` | ^3.0.0 | STOMP protocol implementation over WebSocket for legacy signaling |
| `file_picker` | ^8.0.0 | Native file system picker — opens OS file browser to select files for sending |
| `open_file_plus` | any | Opens received files with the device's native app (e.g., PDF reader, image gallery) |
| `image_gallery_saver_plus` | ^4.0.1 | Saves received image files directly to the device's photo gallery |
| `sensors_plus` | ^5.0.1 | Reads device accelerometer/gyroscope — powers "Sentry Mode" (motion-triggered alerts) |
| `flutter_animate` | ^4.5.0 | Declarative animation effects chained onto any Flutter widget |
| `device_info_plus` | ^10.1.0 | Reads device model, OS version, and unique identifiers for device fingerprinting |
| `shared_preferences` | ^2.5.0 | Persistent key-value storage for user settings (e.g., saved device name, pairing history) |
| `http` | ^1.2.0 | Pure Dart HTTP client for REST API calls and file uploads to the backend |
| `http_parser` | ^4.0.0 | Parses HTTP headers and MIME types; needed by `http` for multipart uploads |
| `lucide_icons` | ^0.257.0 | Flutter port of the Lucide icon set for consistent iconography |
| `nsd` | ^3.0.0 | Network Service Discovery — discovers mDNS/Bonjour-advertised devices on the LAN |
| `network_info_plus` | ^5.0.0 | Gets the device's current IP address and Wi-Fi SSID for subnet scanning |
| `shelf` | ^1.4.0 | Pure Dart HTTP server — the phone runs a local HTTP server to receive files from the desktop |
| `shelf_web_socket` | ^2.0.0 | WebSocket upgrade handler for the Shelf HTTP server |
| `mime` | ^1.0.0 | MIME type detection from file extensions |
| `path_provider` | ^2.1.2 | Gets platform-appropriate file system paths (Documents, Downloads, temp) |
| `permission_handler` | ^11.3.0 | Requests and checks OS-level permissions (storage, network access) at runtime |

---

## 7. Landing Page Dependencies (Next.js)

Located in `landing-page/package.json`.

### Production Dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | ^16.2.1 | React-based full-stack framework with file-system routing, SSR/SSG, and Turbopack |
| `react` / `react-dom` | ^19.0.0 | React 19 — bleeding-edge React with concurrent features |
| `@radix-ui/react-accordion` | ^1.2.3 | Accessible accordion component for FAQ sections |
| `@radix-ui/react-navigation-menu` | ^1.2.5 | Accessible navigation menu component |
| `@radix-ui/react-slot` | ^1.1.2 | Polymorphic slot prop utility for composable components |
| `@radix-ui/react-icons` | ^1.3.2 | Radix icon set |
| `motion` | ^12.5.0 | Framer Motion's new standalone universal animation package |
| `cobe` | ^0.6.3 | WebGL-powered interactive 3D globe visualization |
| `@number-flow/react` | ^0.5.7 | Animated number counter component with smooth transitions |
| `next-themes` | ^0.4.6 | Dark/light mode theme provider for Next.js |
| `lucide-react` | ^0.479.0 | Icon library |
| `marked` | ^15.0.7 | Markdown-to-HTML parser |
| `react-markdown` | ^10.1.0 | Renders Markdown content as React components |
| `remark-gfm` | ^4.0.1 | GitHub-flavored Markdown support (tables, strikethrough, etc.) |
| `class-variance-authority` | ^0.7.1 | Component variant styling |
| `clsx` | ^2.1.1 | Class name utility |
| `tailwind-merge` | ^3.0.2 | Tailwind class merging |
| `tailwindcss-animate` | ^1.0.7 | Animation utilities |
| `react-scan` | ^0.3.2 | Dev-time React performance profiler (highlights re-renders) |
| `color-bits` | ^1.1.0 | Color manipulation utility |

### Dev Dependencies

| Package | Purpose |
|---|---|
| `typescript` | Static typing for all source files |
| `tailwindcss` (v4) | Next-gen Tailwind CSS (using PostCSS plugin) |
| `shiki` | Syntax highlighter for code blocks |
| `eslint` + `eslint-config-next` | Linting rules |

---

## 8. Core Concepts

### 8.1 mDNS / Bonjour (Zero-Config Networking)

**What it is:** mDNS (Multicast DNS) is a protocol that allows devices on the same local network to discover each other by name without a central DNS server. Apple's Bonjour is the most well-known implementation.

**How AnyDrop uses it:**
- The Node.js backend advertises itself as an `_anydrop._tcp` service using `bonjour-service`
- The Flutter app uses `nsd` to browse for active `_anydrop._tcp` services on the LAN
- When the phone finds the desktop, it reads the service's `txt` record to get the IP and port — no manual configuration needed

**Key terms:** ZeroConf, DNS-SD (DNS Service Discovery), service type, `TXT` record

---

### 8.2 WebSocket Signaling (Transfer Negotiation)

**What it is:** WebSocket is a persistent, full-duplex TCP connection. Unlike HTTP, the server can push data to the client at any time.

**How AnyDrop uses it:**
- A raw WebSocket server (using the `ws` library) listens at the `/ws` path
- When a transfer begins, **metadata** (file name, size, transfer ID) is sent via WebSocket to all connected clients
- The receiver sends back an `ACCEPT` or `REJECT` message
- During upload, `PROGRESS` messages are broadcast to update UI on all clients
- The sequence: `FILE_METADATA` → `ACCEPT/REJECT` → actual HTTP POST file upload → `TRANSFER_COMPLETE`

**Message types:**

| Type | Direction | Payload |
|---|---|---|
| `READY` | Server → Client | Handshake on connect |
| `FILE_METADATA` | Sender → Server → Receiver | `{ files, senderName, transferId }` |
| `ACCEPT` | Receiver → Server → All | `{ transferId }` |
| `REJECT` | Receiver → Server → All | `{ transferId }` |
| `PROGRESS` | Server → All | `{ percentage, receivedBytes, totalBytes }` |
| `TEXT_MESSAGE` | Any → Server → Others | `{ text, senderId }` |
| `TRANSFER_COMPLETE` | Server → All | `{ downloadUrl, savedAs }` |

---

### 8.3 Raw HTTP Streaming (File Upload)

**What it is:** Instead of encoding file data as multipart/form-data (which adds overhead), the file binary is streamed directly as the HTTP request body (`Content-Type: application/octet-stream`).

**How AnyDrop uses it:**
```
Mobile/Sender  ──── POST /upload (raw binary) ────►  Node.js
                     Headers:
                     X-File-Name: photo.jpg
                     X-Transfer-Id: abc-123
                     Content-Length: 4096000
```
The server pipes the request stream directly to a writable file stream:
```js
req.pipe(out);  // Zero-copy, memory-efficient
```
This avoids loading the entire file into memory and is far more efficient for large files.

---

### 8.4 JWT Authentication

**What it is:** JSON Web Token — a stateless authentication mechanism. The server signs a token with a secret key; the client sends this token in every subsequent request.

**Flow in AnyDrop:**
1. User logs in → server verifies password (bcrypt) → signs JWT (`jsonwebtoken`) → sends token
2. Client stores token (localStorage / memory) → attaches as `Authorization: Bearer <token>` header
3. Server middleware verifies signature on protected routes

**Claims in the token:** `userId`, `email`, `role` (USER / ADMIN), `planId`, `exp` (expiry)

---

### 8.5 ORM and Database (Sequelize + PostgreSQL)

**What it is:** An ORM (Object-Relational Mapper) lets you interact with a SQL database using JavaScript objects instead of raw SQL queries.

**Sequelize models in AnyDrop:**

| Model | Table | Key Fields |
|---|---|---|
| `User` | `users` | `id`, `email`, `password` (hashed), `role`, `planId`, `enabled` |
| `Plan` | `plans` | `name`, `speedLimit`, `fileSizeLimit`, `dailyTransferLimit`, `storageLimitGB`, `monthlyPrice` |
| `HistoryItem` | `history_items` | `filename`, `size`, `direction` (SENT/RECEIVED), `userId` |
| `Coupon` | `coupons` | `code`, `discountPercent`, `usageLimit`, `expiresAt` |
| `Transaction` | `transactions` | `userId`, `planId`, `amount`, `status` |
| `ServerSettings` | `server_settings` | `key`, `value` (e.g., `device_name`) |
| `ResetToken` | `reset_tokens` | `token`, `userId`, `expiresAt` |
| `DeviceInfo` | `device_info` | `deviceId`, `name`, `type`, `lastSeen` |

**`sequelize.sync({ alter: true })`** — automatically updates existing tables to match model definitions without dropping data.

---

### 8.6 Rate Limiting

`express-rate-limit` is used to protect all API endpoints. The window is 15 minutes with a max of 100 requests. This prevents brute-force attacks on auth endpoints and API abuse.

---

### 8.7 Flutter Architecture

The Flutter app follows the **Provider pattern** for state management:
- `ChangeNotifier` classes hold app state (e.g., connected devices, active transfer)
- Widgets consume state via `context.watch<T>()` and `context.read<T>()`

The app runs a local **Shelf HTTP server** (imported from Dart) so it can also act as a *receiver* — the desktop can `POST /upload` to the phone's IP, not just the other way around.

---

### 8.8 Pairing Code System

To prevent unauthorized transfers, a 6-digit pairing code (valid for 5 minutes) is generated using `crypto.randomInt`. The mobile device must enter this code before the transfer is accepted. Codes are stored in an in-memory `Map` keyed by `deviceId`.

---

## 9. How File Transfer Works — End to End

```
1. DISCOVERY
   Mobile app scans LAN using nsd (mDNS browser)
   Finds "AnyDrop-Desktop" service → gets IP:Port

2. CONNECTION
   Mobile connects to ws://desktop-ip:8080/ws
   Server sends { type: "READY" }

3. INITIATE TRANSFER (Mobile → Desktop)
   Mobile sends: { type: "FILE_METADATA", files: [...], senderName: "Aaditya's iPhone" }
   Server relays this to all connected WebSocket clients (the web browser)

4. CONSENT (Desktop browser)
   User sees incoming transfer notification
   Clicks Accept → browser sends { type: "ACCEPT", transferId: "..." } via WebSocket

5. UPLOAD (Mobile → Desktop)
   Mobile does: POST http://desktop-ip:8080/upload
   Headers: X-File-Name, X-Transfer-Id, Content-Type: application/octet-stream
   Body: raw binary file data (streamed, not buffered)

6. PROGRESS UPDATES
   Server tracks received bytes on each 'data' event
   Broadcasts { type: "PROGRESS", percentage: 73 } to all WS clients
   Browser shows live progress bar

7. COMPLETION
   Server broadcasts { type: "TRANSFER_COMPLETE", downloadUrl: "/api/files/..." }
   Browser auto-downloads or shows download button
   Confetti animation plays
```

---

## 10. Database Models

```
┌─────────────┐    ┌───────────┐    ┌──────────────────┐
│    User     │───►│   Plan    │    │   HistoryItem    │
│─────────────│    │───────────│    │──────────────────│
│ id (PK)     │    │ id (PK)   │    │ id (PK)          │
│ username    │    │ name      │    │ filename         │
│ email       │    │ speedLimit│    │ size             │
│ password    │    │ fileLimit │    │ direction        │
│ role        │    │ dailyLimit│    │ userId (FK)      │
│ enabled     │    │ storageGB │    │ createdAt        │
│ planId (FK) │    │ monthly$  │    └──────────────────┘
└─────────────┘    └───────────┘
       │
       ▼
┌─────────────┐    ┌───────────────┐
│ ResetToken  │    │ ServerSettings│
│─────────────│    │───────────────│
│ token       │    │ key           │
│ userId (FK) │    │ value         │
│ expiresAt   │    └───────────────┘
└─────────────┘
```

---

## 11. FAQ — For Technical Interviews

### General Architecture

**Q: Why did you choose Node.js for the backend instead of a more traditional server like Spring Boot or Django?**
> Node.js is extremely well-suited for I/O-bound, real-time applications. Since AnyDrop's core workload is streaming file data and maintaining persistent WebSocket connections — not CPU-intensive computation — Node's non-blocking event loop provides excellent throughput with low resource usage. It also lets me share JavaScript knowledge across the full stack.

**Q: Why does your project have both Socket.IO and the `ws` library? Aren't they doing the same thing?**
> Not exactly. `Socket.IO` is higher-level — it includes automatic reconnection, fallback to HTTP polling, and a room/event abstraction. It was used for my initial, STOMP-based signaling layer. The `ws` library is a lightweight, low-level WebSocket implementation — I added a dedicated `/ws` endpoint for the local file transfer signaling because it gave me more direct control over the message protocol and eliminated the overhead of `socket.io`'s framing. Having both lets legacy clients continue working while the newer, simpler protocol is used for local transfers.

**Q: How does device discovery work without a central server?**
> It uses **mDNS (Multicast DNS)**, the same technology behind Apple's Bonjour. When the Node.js backend starts, it broadcasts a service announcement to the local network's multicast address (224.0.0.251, port 5353). Any device on the same subnet listening for `_anydrop._tcp` services receives this announcement. The Flutter app uses the `nsd` package to subscribe to these broadcasts. The `TXT` record in the mDNS packet contains the desktop's IP, port, and device ID — so the phone can connect without any manual configuration.

---

### File Transfer Mechanics

**Q: Why don't you use `multer` for file uploads? It's the standard for Node.js.**
> `multer` is excellent for traditional multipart/form-data uploads — typically used in HTML forms. For peer-to-peer transfers, it adds unnecessary overhead: multipart encoding inflates the payload size, and `multer` buffers chunks before writing. Instead, I use raw streaming: the sender sets `Content-Type: application/octet-stream` and the binary data is the entire request body. The server does `req.pipe(writableStream)`, which is zero-copy all the way to disk. This is faster, uses almost no extra memory, and supports very large files.

**Q: What happens if the transfer is interrupted mid-way?**
> The WebSocket connection will trigger a `close` or `error` event. The `req` stream on the server will emit an `error` event, at which point we call `out.destroy()` to clean up the partially-written file, and broadcast a `TRANSFER_ERROR` message via WebSocket. Currently, the partial file is not cleaned up automatically, which is a known improvement area — resumable uploads (using `Content-Range` headers) would be the proper solution.

**Q: How do you track upload progress without buffering the whole file?**
> Node.js streams emit a `data` event for every chunk received. I attach a listener to `req.on('data', chunk => ...)` that increments a `receivedBytes` counter and compares it to the `Content-Length` header to compute the percentage. I rate-limit these broadcasts to once every 100ms to avoid overwhelming the WebSocket with updates, while still giving a smooth UI experience.

---

### Security

**Q: How does the app prevent unauthorized devices from sending files?**
> Two mechanisms: First, mDNS discovery only works on the same local network segment — devices on different subnets can't discover each other. Second, we have a **pairing code system** — the desktop generates a 6-digit code (using Node's `crypto.randomInt` for cryptographic randomness) with a 5-minute TTL. The phone user must enter this code before the desktop accepts any incoming transfer request.

**Q: How are passwords stored?**
> Using `bcryptjs`. Passwords are never stored in plaintext. `bcrypt` hashes a password with a per-user random salt using a computationally expensive key derivation function, making brute-force attacks extremely slow. On login, `bcrypt.compare()` re-derives the hash and compares — the original password is never stored.

**Q: What does your rate limiting protect against?**
> `express-rate-limit` applies globally: 100 requests per IP per 15 minutes. This protects against brute-force login attacks and general API abuse. For production, I'd add a more granular limit on `/api/auth/login` specifically (e.g., 5 attempts per minute) and consider IP blacklisting for repeat offenders.

---

### Frontend

**Q: Why Vite instead of Create React App (CRA)?**
> CRA is largely deprecated and extremely slow — it bundles everything through Webpack even during development. Vite serves files over native ES Modules during dev, so the browser only loads what it needs. Hot Module Replacement is nearly instant. For production builds, Vite uses Rollup which produces smaller, more optimized bundles. The DX difference is enormous.

**Q: How does the drag-and-drop file transfer work in the browser?**
> `react-dropzone` wraps the HTML5 `File API` and Drag-and-Drop events. When a user drops files, it calls an `onDrop` callback with a `File[]` array. Each `File` object is a reference to the user's file on disk (not the content itself). When the user confirms the transfer, I use the `fetch` API with the file object as the body — the browser handles streaming the binary data as an HTTP request to `/upload`.

**Q: What is Framer Motion used for and why it over plain CSS animations?**
> Framer Motion provides a declarative API for complex animations — especially layout animations (where elements move to new positions), gesture-based interactions (drag), and orchestrated sequences. Plain CSS is great for simple hover/transition effects, but coordinating multi-step animations, exit animations (unmounting components), and physics-based spring animations is where Framer Motion excels.

---

### Flutter / Mobile

**Q: The Flutter app acts as both a sender and receiver. How does it receive files?**
> The Flutter app uses the `shelf` package to spin up a local HTTP server (an embedded web server directly in the app). When it wants to receive a file, it binds to a port, registers its address via WebSocket signaling, and the desktop backend sends `POST /upload` to the phone's IP and port instead. The `http` package handles incoming request routing with `shelf_web_socket` for WebSocket upgrades.

**Q: Why Provider for state management instead of Riverpod or BLoC?**
> Provider is Flutter's officially recommended starting point and integrates natively with the Flutter widget tree via `InheritedWidget`. For this project's scope — managing device state, transfer progress, and settings — Provider's simplicity and minimal boilerplate is ideal. Riverpod would be a clean upgrade for a larger team (better testability, no BuildContext dependency), and BLoC would add justified complexity only if the state logic grew significantly more complex.

**Q: What is "Sentry Mode" you mentioned using `sensors_plus` for?**
> Sentry Mode is a feature where the phone uses its accelerometer (via `sensors_plus`) to detect motion while the app is in a locked/monitoring state. If unexpected movement is detected and the phone hasn't been unlocked, it can trigger an alert. It's a fun UX feature borrowing the name from Tesla's security feature.

---

### Database & ORM

**Q: Why Sequelize over a raw SQL query approach like `pg`?**
> Sequelize provides model definitions, associations, automatic migrations (`sync({ alter: true })`), and query building in a type-safe-enough way for JavaScript. It prevents SQL injection by default through parameterized queries. For a project with multiple models and relationships (User → Plan, User → History, etc.), the ORM approach reduces boilerplate significantly. For high-throughput analytics queries, I'd drop down to raw SQL via `sequelize.query()`.

**Q: What does `sequelize.sync({ alter: true })` do, and what are the risks?**
> `sync({ alter: true })` instructs Sequelize to compare each model definition against the actual table schema in PostgreSQL and run `ALTER TABLE` statements to add missing columns or change types. It's convenient for development. **The risk in production** is that it can cause data loss if a column type changes incompatibly, and it can cause race conditions during rolling deployments. In production, proper versioned migrations (using `sequelize-cli`) would replace this.

---

### Next.js Landing Page

**Q: Why Next.js for the landing page if the main app is React+Vite?**
> The landing page has very different requirements — it needs to be indexable by search engines (SEO), load fast on first visit (performance), and the content is largely static. Next.js with SSG (Static Site Generation) generates HTML at build time, which is served as static files — ideal for a marketing page. The main app (React+Vite) is a SPA that runs entirely in the browser, which is fine for an authenticated dashboard but would be poor SEO.

**Q: What is `cobe` used for on the landing page?**
> `cobe` renders an interactive, WebGL-powered 3D globe using a small, lightweight renderer. On the AnyDrop landing page it's used as a visual element to represent the "global"/"networked" nature of the app — it gives the page a premium, modern aesthetic that grabs attention.

---

*Document last updated: March 2026 | Project: AnyDrop v1.0*
