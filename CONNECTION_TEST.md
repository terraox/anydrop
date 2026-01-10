# Connection Test Guide

## ✅ Server Status

**Server is running!**
- **IP Address**: `192.168.1.4`
- **Port**: `3000`
- **Status**: ✅ Active
- **Device Name**: `hello`
- **Device ID**: `bfc5f423-0753-4d97-9603-2dd4203a5948`

## Testing Connection from Flutter App

### 1. Make sure both devices are on the same Wi-Fi network

### 2. Open the Flutter app on your phone (via USB debugging)

### 3. Navigate to Settings screen

The Settings screen now has a **"LOCAL FILE TRANSFER"** section at the top that shows:
- ✅ Connection status (Connected/Not Connected)
- Device information
- List of discovered devices on the network
- Refresh button to test connection

### 4. Check the connection status

The widget will automatically test the connection when you open Settings. You should see:
- ✅ **Green checkmark** if connected
- ❌ **Red X** if not connected

### 5. If not connected, check:

1. **Server is running**: 
   ```bash
   cd backend-node
   npm run local-transfer
   ```

2. **IP address is correct**: 
   - The Flutter app uses `192.168.1.4:3000`
   - If your computer's IP changed, update `mobile-app/lib/services/local_file_transfer_service.dart`

3. **Firewall**: Make sure port 3000 is not blocked

4. **Same network**: Phone and computer must be on the same Wi-Fi

## Manual Test from Phone

You can also test directly from your phone's browser:
```
http://192.168.1.4:3000/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "device": {
    "deviceId": "...",
    "deviceName": "..."
  }
}
```

## API Endpoints Available

- `GET /health` - Health check
- `GET /api/test` - Connection test
- `GET /api/devices` - List discovered devices
- `GET /api/device/info` - Get this device info
- `GET /api/pairing-code` - Get pairing code
- `POST /api/transfer/send` - Send file to another device

## Next Steps

Once connected, you can:
1. See discovered devices in the Settings screen
2. Send files between devices
3. Receive files from other devices
