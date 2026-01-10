# Local File Transfer System

This is a production-ready local file transfer system using mDNS discovery and HTTP streaming.

## Architecture

### Core Components

1. **mDNS Advertiser** (`services/mdnsAdvertiser.js`)
   - Advertises this device on the local network
   - Service type: `_filedrop._tcp`
   - Port: 3000
   - TXT records: `name` (device name), `id` (device ID)
   - Automatically restarts when device name changes

2. **mDNS Browser** (`services/mdnsBrowser.js`)
   - Discovers other devices on the local network
   - Maintains live list of available devices
   - Emits events for device discovery, updates, and removal

3. **File Server** (`services/fileServer.js`)
   - HTTP server for receiving files
   - Endpoint: `POST /upload`
   - Uses streaming (busboy) - no buffering entire file in memory
   - Pairing code security

4. **File Sender** (`services/fileSender.js`)
   - HTTP client for sending files
   - Supports streaming and progress tracking
   - Uses native Node.js http module

5. **Device Manager** (`services/deviceManager.js`)
   - Manages device identity (name and ID)
   - Persists deviceId in database
   - Handles device name updates

## Running the Server

```bash
cd backend-node
npm install
node localFileTransferServer.js
```

The server will:
- Start on port 3000 (configurable via `LOCAL_FILE_TRANSFER_PORT`)
- Initialize device ID (or load existing)
- Start mDNS advertising
- Start mDNS browsing for other devices

## API Endpoints

### Device Discovery

- `GET /api/devices` - Get list of discovered devices
- `GET /api/device/info` - Get this device's info
- `POST /api/device/name` - Update device name
  ```json
  { "name": "My-Device-Name" }
  ```

### File Transfer

- `GET /pairing-code` - Get pairing code (requires `X-Device-Id` header)
- `GET /api/pairing-code` - Get pairing code for this device (no header needed)
- `POST /upload` - Receive file (requires `X-Device-Id` and `X-Pairing-Code` headers)
- `POST /api/transfer/send` - Send file to another device
  ```json
  {
    "targetDeviceId": "device-uuid",
    "filePath": "/path/to/file"
  }
  ```

### File Management

- `GET /files` - List all received files
- `GET /files/:filename` - Download a received file

## Usage Flow

### Sending a File

1. Discover devices: `GET /api/devices`
2. Get pairing code from target: `GET http://target-ip:3000/pairing-code` with `X-Device-Id` header
3. Send file: `POST /api/transfer/send` with `targetDeviceId` and `filePath`

### Receiving a File

1. Device automatically advertises itself via mDNS
2. When file is sent, pairing code is validated
3. File is streamed to disk in `uploads/` directory

## Device Name Changes

When device name is updated:
1. mDNS service is stopped
2. New service is advertised with new name
3. Other devices automatically see the update via mDNS

## Security

- Pairing codes are 6-digit numbers
- Codes expire after 5 minutes
- Each transfer requires valid pairing code
- Pairing code is device-specific

## Requirements

- Node.js 18+ (for native fetch support, or use node-fetch)
- Devices must be on the same Wi-Fi network
- Port 3000 must be accessible on local network

## Dependencies

- `bonjour-service` - mDNS/Bonjour implementation
- `busboy` - Streaming multipart form parser
- `express` - HTTP server
- `uuid` - Device ID generation

## Notes

- Files are saved to `backend-node/uploads/` directory
- Device ID is persistent (stored in database)
- Device name is user-editable and stored in database
- mDNS automatically handles IP changes
- Service name collisions are auto-resolved by mDNS
