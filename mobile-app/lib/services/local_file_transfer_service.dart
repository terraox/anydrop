import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';

/// Service for connecting to the local file transfer server
/// Uses discovered device IP from mDNS, not hardcoded localhost
class LocalFileTransferService {
  // Base URL - should be set from discovered device IP
  String? _baseUrl;
  static const Duration timeout = Duration(seconds: 5);
  
  /// Set the base URL from discovered device IP
  void setBaseUrl(String ip, int port) {
    _baseUrl = 'http://$ip:$port';
    debugPrint('🌐 LocalFileTransferService: Set base URL to $_baseUrl');
  }
  
  /// Get base URL (throws if not set)
  String get baseUrl {
    if (_baseUrl == null) {
      throw StateError('Base URL not set. Call setBaseUrl() first with discovered device IP.');
    }
    return _baseUrl!;
  }

  /// Test connectivity to a device at the given IP and port
  Future<bool> testConnection(String ip, int port) async {
    try {
      final url = 'http://$ip:$port';
      final response = await http
          .get(Uri.parse('$url/health'))
          .timeout(timeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        debugPrint('✅ Connected to local file transfer server');
        debugPrint('   Device: ${data['device']['deviceName']} (${data['device']['deviceId']})');
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('❌ Failed to connect to local file transfer server: $e');
      return false;
    }
  }

  /// Get list of discovered devices from a specific device
  Future<List<Map<String, dynamic>>> getDiscoveredDevices(String ip, int port) async {
    try {
      final url = 'http://$ip:$port';
      final response = await http
          .get(Uri.parse('$url/api/devices'))
          .timeout(timeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data['devices'] ?? []);
      }
      return [];
    } catch (e) {
      debugPrint('❌ Failed to get devices: $e');
      return [];
    }
  }

  /// Get device info from a specific device
  Future<Map<String, dynamic>?> getDeviceInfo(String ip, int port) async {
    try {
      final url = 'http://$ip:$port';
      final response = await http
          .get(Uri.parse('$url/api/device/info'))
          .timeout(timeout);

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      debugPrint('❌ Failed to get device info: $e');
      return null;
    }
  }

  /// Get pairing code from a specific device
  Future<String?> getPairingCode(String ip, int port) async {
    try {
      final url = 'http://$ip:$port';
      final response = await http
          .get(Uri.parse('$url/api/pairing-code'))
          .timeout(timeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['code'] as String?;
      }
      return null;
    } catch (e) {
      debugPrint('❌ Failed to get pairing code: $e');
      return null;
    }
  }

  /// Send a file to another device using discovered device IP
  /// targetDevice should have ip and port from mDNS discovery
  Future<Map<String, dynamic>?> sendFile({
    required String targetDeviceId,
    required String targetDeviceIp,
    required int targetDevicePort,
    required String filePath,
  }) async {
    try {
      // Use discovered device IP, not hardcoded localhost
      final targetUrl = 'http://$targetDeviceIp:$targetDevicePort';
      
      // Get pairing code from target device
      final pairingCodeResponse = await http
          .get(Uri.parse('$targetUrl/api/pairing-code'))
          .timeout(timeout);
      
      if (pairingCodeResponse.statusCode != 200) {
        debugPrint('❌ Failed to get pairing code from target device');
        return null;
      }
      
      final pairingData = jsonDecode(pairingCodeResponse.body);
      final pairingCode = pairingData['code'] as String;
      
      // Send file using HTTP streaming (not WebSocket)
      final file = File(filePath);
      final fileName = file.path.split('/').last;
      final fileSize = await file.length();
      
      final request = http.MultipartRequest('POST', Uri.parse('$targetUrl/upload'));
      request.headers['X-Device-Id'] = targetDeviceId;
      request.headers['X-Pairing-Code'] = pairingCode;
      request.headers['X-Sender-Device-Id'] = 'flutter-app'; // TODO: Get actual device ID
      
      final multipartFile = await http.MultipartFile.fromPath('file', filePath);
      request.files.add(multipartFile);
      
      final streamedResponse = await request.send().timeout(Duration(minutes: 10));
      final response = await http.Response.fromStream(streamedResponse);
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      debugPrint('❌ Failed to send file: $e');
      return null;
    }
  }
}
