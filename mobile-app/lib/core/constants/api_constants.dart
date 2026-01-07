/// API and WebSocket constants for AnyDrop
class ApiConstants {
  // Backend Base URL
  static const String baseUrl = 'http://192.168.1.59:8080';
  static const String apiUrl = '$baseUrl/api';

  // WebSocket Endpoints
  static const String wsUrl = 'ws://192.168.1.59:8080/ws';
  static const String wsTransfer = '$wsUrl/transfer';
  static const String wsTrackpad = '$wsUrl/trackpad';

  // Auth Endpoints
  static const String login = '$apiUrl/auth/login';
  static const String register = '$apiUrl/auth/register';
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
