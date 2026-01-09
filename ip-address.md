# IP Address Configuration Guide

When switching to a new WiFi network, update the IP address in the following locations.

---

## 📱 Mobile App (Flutter)

### File: `mobile-app/lib/core/constants/api_constants.dart`

**Lines 4 & 8** - Update both HTTP and WebSocket URLs:

```dart
// CURRENT
static const String baseUrl = 'http://192.168.1.59:8080';
static const String wsUrl = 'ws://192.168.1.59:8080/ws';

// CHANGE TO (example with new IP: 10.0.0.5)
static const String baseUrl = 'http://10.0.0.5:8080';
static const String wsUrl = 'ws://10.0.0.5:8080/ws';
```

**Note:** Replace `10.0.0.5` with your actual new IP address.

---

## 🌐 Web Frontend

### ✅ Already Dynamic!

The web frontend now automatically detects the IP from the browser URL. **No changes needed.**

**How it works:**
- File: `frontend/src/services/api.js`
- Uses `window.location.hostname` to auto-detect
- Just access via: `http://YOUR_NEW_IP:5173`

---

## 🖥️ Backend

### File: `backend/src/main/java/com/anydrop/backend/service/DiscoveryService.java`

**Line 44** - Update mDNS broadcast IP:

```java
// CURRENT
InetAddress localhost = InetAddress.getByName("192.168.1.59");

// CHANGE TO (example with new IP: 10.0.0.5)
InetAddress localhost = InetAddress.getByName("10.0.0.5");
```

### File: `backend/src/main/resources/application.properties`

**Usually no changes needed**, but verify there are no hardcoded IPs.

---

## 🔄 Quick Change Workflow

When you get a new IP (e.g., `192.168.50.100`):

1. **Provide me with:**
   - New IP Address: `192.168.50.100`
   - Pairing Code (if needed for mobile): `XXXX`
   
2. **I will update:**
   - ✅ `mobile-app/lib/core/constants/api_constants.dart` (Lines 4 & 8)
   - ✅ `backend/src/main/java/com/anydrop/backend/service/DiscoveryService.java` (Line 44)
   - ✅ Verify no other backend hardcoded IPs
   
3. **Web app:** Nothing needed (auto-detects)

4. **Restart servers:**
   ```bash
   # Backend (if needed)
   cd backend && ./mvnw spring-boot:run
   
   # Frontend (access via new IP)
   cd frontend && npm run dev
   # Access: http://NEW_IP:5173
   
   # Mobile app
   cd mobile-app && flutter run
   ```

---

## 📋 Network Switch Checklist

- [ ] Get new local IP: `ifconfig | grep "inet "` (Mac/Linux) or `ipconfig` (Windows)
- [ ] Provide new IP to assistant
- [ ] Assistant updates Flutter constants
- [ ] Rebuild Flutter app: `flutter run`
- [ ] Access web app via new IP: `http://NEW_IP:5173`
- [ ] Test device discovery between devices

---

## 🛠️ Finding Your New IP

### Mac/Linux:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Windows (PowerShell):
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*"}
```

Look for an address like `192.168.x.x` or `10.0.x.x`

---

## 🎯 Current Configuration

**Last Updated:** 2026-01-08 17:08

**Current Server IP:** `192.168.1.2`
**Phone IP:** `192.168.1.4`

**Files Using This IP:**
- `mobile-app/lib/core/constants/api_constants.dart`
- `backend/src/main/java/com/anydrop/backend/service/DiscoveryService.java`

**Files Auto-Detecting:**
- `frontend/src/services/api.js` (Dynamic)
- `frontend/src/pages/user/ClassicOrbit.jsx` (Uses api service)
- `frontend/src/pages/user/BentoOrbit.jsx` (Uses api service)
- `frontend/src/pages/user/Settings.jsx` (Uses api service)

---

## 💡 Pro Tip

To minimize changes, consider:
1. Setting a **static IP** on your computer in router settings
2. Using **mDNS** (future enhancement) - devices find each other by name instead of IP
3. Using **localhost tunneling** services like ngrok for testing

---

**Ready for network switch?** Just provide the new IP and I'll make the updates! 🚀
