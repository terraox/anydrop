# WebSocket Connection Fixes

## Issues Fixed

### 1. ✅ Removed WebSocket Creation from Receive Page
- **ReceiveHub**: Does NOT create any WebSocket connections
- **DeviceProvider**: All WebSocket client creation disabled
- **Receiver**: Only hosts HTTP server, never creates WebSocket clients

### 2. ✅ Single WebSocket Connection on Sender Side
- **TransferService.connectToReceiver()**: The ONLY place where WebSocket connections are created
- **Disconnect First**: Always disconnects existing connection before creating new one
- **One Connection**: Ensures exactly ONE WebSocket connection at a time

### 3. ✅ Uses Receiver IP from mDNS (Never Localhost)
- **connectToReceiver()**: Uses `receiverIp` parameter from mDNS discovery
- **No Hardcoded IPs**: All WebSocket URLs built from discovered device IPs
- **Validation**: Checks that IP is not null before connecting

### 4. ✅ Single WebSocket Path /ws
- **Removed**: `/ws/transfer` and `/ws/trackpad` paths
- **Single Path**: All WebSocket connections use `/ws` only
- **Updated**: `api_constants.dart` to remove deprecated paths

### 5. ✅ Disabled STOMP and Auto-Reconnect
- **Plain WebSocket**: Uses `web_socket_channel` package (no STOMP)
- **No Auto-Reconnect**: Connection is created on-demand, not persistent
- **STOMP Disabled**: `WebSocketService` (STOMP) is not used for local file transfer

## Implementation Details

### Sender (Flutter - TransferService)
**File**: `mobile-app/lib/services/transfer_service.dart`

```dart
Future<bool> connectToReceiver(String receiverIp, int receiverPort) async {
  // 1. Disconnect existing connection (ensures only ONE)
  await disconnect();
  
  // 2. Connect using discovered IP (never localhost)
  final wsUrl = 'ws://$receiverIp:$receiverPort/ws';
  _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
  
  // 3. Wait for READY handshake
  // 4. Return connection status
}
```

**Key Points**:
- ✅ Only method that creates WebSocket connections
- ✅ Always disconnects first (prevents multiple connections)
- ✅ Uses discovered IP from mDNS
- ✅ Uses single path `/ws`
- ✅ Plain WebSocket (no STOMP)

### Receiver (Flutter - DeviceProvider)
**File**: `mobile-app/lib/providers/device_provider.dart`

```dart
void _setupWebSocketListeners() {
  // NO WebSocket connections created here
  // Receiver only hosts HTTP server
  _isConnected = true; // HTTP server is running
}

Future<void> connectToDevice(...) {
  // DISABLED - Receiver does not connect
}

Future<void> connectToServer(...) {
  // DISABLED - Receiver does not connect
}
```

**Key Points**:
- ✅ No WebSocket client creation
- ✅ Only hosts HTTP server
- ✅ All connection methods disabled

### API Constants
**File**: `mobile-app/lib/core/constants/api_constants.dart`

```dart
// REMOVED: getWsTransferUrl (was using /ws/transfer)
// REMOVED: getWsTrackpadUrl (was using /ws/trackpad)
// SINGLE PATH: getWsUrl uses /ws only
static String getWsUrl(String deviceIp, int devicePort) => 'ws://$deviceIp:$devicePort/ws';
```

## Architecture

### Sender Flow
1. User selects file to send
2. `sendFile()` called with target device
3. `connectToReceiver()` creates ONE WebSocket connection
4. Waits for READY handshake
5. Sends FILE_METADATA
6. Waits for ACCEPT
7. Uploads file via HTTP POST `/upload`
8. Disconnects WebSocket after transfer

### Receiver Flow
1. App starts
2. HTTP server starts on port 8080
3. WebSocket server starts on `/ws` (Node.js backend)
4. **NO WebSocket client connections created**
5. Receives files via HTTP POST `/upload`
6. WebSocket server handles signaling (READY, ACCEPT, REJECT)

## Testing Checklist

- [ ] Sender creates exactly ONE WebSocket connection
- [ ] Receiver does NOT create any WebSocket connections
- [ ] WebSocket uses discovered IP (not localhost)
- [ ] WebSocket uses single path `/ws`
- [ ] No STOMP protocol used
- [ ] No auto-reconnect logic
- [ ] File transfers work correctly

## Files Modified

1. `mobile-app/lib/core/constants/api_constants.dart` - Removed `/ws/transfer` and `/ws/trackpad` paths
2. `mobile-app/lib/providers/device_provider.dart` - Disabled all WebSocket client creation
3. `mobile-app/lib/services/transfer_service.dart` - Enhanced `connectToReceiver()` with better documentation
