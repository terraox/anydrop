/// API and WebSocket constants for AnyDrop
/// IMPORTANT: Do NOT use hardcoded IPs. Always use discovered device IPs from mDNS.
/// These constants are for reference only - actual URLs must be built from discovered device IPs.
class ApiConstants {
  // NOTE: baseUrl should NOT be used for local file transfer
  // This is kept for backward compatibility with main server API only
  // For local file transfer, ALWAYS use discovered device IP from mDNS
  @Deprecated('DO NOT USE for local file transfer. Use discovered device IP from mDNS instead. This is only for main server API.')
  static const String baseUrl = 'http://192.168.1.4:8080';
  
  @Deprecated('Use discovered device IP from mDNS instead')
  static const String apiUrl = '$baseUrl/api';

  // WebSocket Endpoints - MUST use discovered device IP, not hardcoded
  // IMPORTANT: Use only /ws path (not /ws/transfer or /ws/trackpad)
  // Single WebSocket path for all signaling
  @Deprecated('Use discovered device IP from mDNS to build WebSocket URL')
  static String getWsUrl(String deviceIp, int devicePort) => 'ws://$deviceIp:$devicePort/ws';
  
  // REMOVED: getWsTransferUrl - use getWsUrl instead (single /ws path)
  // REMOVED: getWsTrackpadUrl - use getWsUrl instead (single /ws path)

  // Auth Endpoints
  static const String login = '$apiUrl/auth/login';
  static const String register = '$apiUrl/auth/signup';
  static const String logout = '$apiUrl/auth/logout';

  // User Endpoints
  static const String userProfile = '$apiUrl/user/profile';
  static const String userDevices = '$apiUrl/user/devices';

  // File Endpoints
  static const String fileUpload = '$apiUrl/files/upload';
  static const String fileDownload = '$apiUrl/files/download';
  static const String fileHistory = '$apiUrl/files/history';

  // Timeouts
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 60);
}
