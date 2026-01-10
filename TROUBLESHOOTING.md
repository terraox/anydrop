# Troubleshooting: Laptop Not Visible in Flutter App

## ✅ Fixed Issues

1. **Service Type Mismatch**: Changed from `_filedrop._tcp` to `_anydrop._tcp` to match Flutter app
2. **Added `/api/identify` endpoint**: Required for subnet scanning discovery
3. **Updated mDNS TXT records**: Added `icon`, `type`, and `app` fields that Flutter app expects

## Current Status

- **Server IP**: `192.168.1.4`
- **Server Port**: `3000`
- **Device Name**: `hello`
- **Device ID**: `bfc5f423-0753-4d97-9603-2dd4203a5948`
- **mDNS Service**: `_anydrop._tcp` ✅
- **Server Status**: Running ✅

## How to Verify

### 1. Check Server is Running
```bash
cd backend-node
npm run local-transfer
```

You should see:
```
📡 mDNS: Advertising "hello" (bfc5f423-0753-4d97-9603-2dd4203a5948) on 192.168.1.4:3000
```

### 2. Test from Phone Browser
Open on your phone:
```
http://192.168.1.4:3000/api/identify
```

Should return:
```json
{
  "app": "AnyDrop",
  "name": "hello",
  "id": "bfc5f423-0753-4d97-9603-2dd4203a5948",
  "deviceId": "bfc5f423-0753-4d97-9603-2dd4203a5948",
  "icon": "laptop",
  "type": "DESKTOP",
  "version": "1.0.0"
}
```

### 3. Check Flutter App

1. Open the Flutter app
2. Go to **Settings** screen
3. Look at the **"LOCAL FILE TRANSFER"** section
4. The connectivity widget should show:
   - ✅ Connected (green checkmark)
   - Device name: `hello`
   - Device ID: `bfc5f423-0753-4d97-9603-2dd4203a5948`

### 4. Check Device Discovery

The Flutter app uses two methods:
1. **mDNS Discovery** - Should find devices automatically
2. **Subnet Scanning** - Scans port 8080 (won't find port 3000 server)

**Note**: The subnet scanner only checks port 8080, but mDNS should work for discovery.

## If Still Not Visible

1. **Check Wi-Fi**: Both devices must be on the same network
2. **Check Firewall**: Port 3000 must be open
3. **Restart Server**: Stop and restart the server
4. **Restart Flutter App**: Close and reopen the app
5. **Check mDNS**: On Mac, run:
   ```bash
   dns-sd -B _anydrop._tcp local.
   ```
   You should see your device listed

## Next Steps

If the laptop still doesn't appear:
1. Check Flutter app logs for mDNS errors
2. Verify the IP address hasn't changed
3. Try manually adding the device in the Flutter app (if that feature exists)
4. Check if mDNS is working on your network (some networks block mDNS)
