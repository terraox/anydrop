import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:network_info_plus/network_info_plus.dart';

/// Discovered device from subnet scan
class ScannedDevice {
  final String id;
  final String name;
  final String icon;
  final String ip;
  final int port;
  final String type;

  ScannedDevice({
    required this.id,
    required this.name,
    required this.icon,
    required this.ip,
    required this.port,
    required this.type,
  });

  @override
  String toString() => 'ScannedDevice($name @ $ip:$port)';
}

/// Subnet Scanner Service
/// Scans the local network for AnyDrop devices by probing each IP
class SubnetScannerService {
  static const int defaultPort = 8080;
  static const Duration connectionTimeout = Duration(milliseconds: 500);
  static const Duration httpTimeout = Duration(seconds: 2);

  final List<ScannedDevice> _devices = [];
  bool _isScanning = false;
  final _devicesController = StreamController<List<ScannedDevice>>.broadcast();

  List<ScannedDevice> get devices => List.unmodifiable(_devices);
  bool get isScanning => _isScanning;
  Stream<List<ScannedDevice>> get devicesStream => _devicesController.stream;

  /// Get the device's local IP address
  Future<String?> getLocalIp() async {
    try {
      final info = NetworkInfo();
      final wifiIP = await info.getWifiIP();
      if (wifiIP != null && wifiIP.isNotEmpty) {
        return wifiIP;
      }

      // Fallback: try to get IP from network interfaces
      for (var interface in await NetworkInterface.list()) {
        for (var addr in interface.addresses) {
          if (addr.type == InternetAddressType.IPv4 && !addr.isLoopback) {
            return addr.address;
          }
        }
      }
    } catch (e) {
      debugPrint('❌ Failed to get local IP: $e');
    }
    return null;
  }

  /// Extract subnet from IP (e.g., "192.168.1.15" -> "192.168.1")
  String? getSubnet(String ip) {
    final parts = ip.split('.');
    if (parts.length == 4) {
      return '${parts[0]}.${parts[1]}.${parts[2]}';
    }
    return null;
  }

  /// Scan the subnet for AnyDrop devices
  Future<void> scanNetwork({int port = defaultPort}) async {
    if (_isScanning) return;

    _isScanning = true;
    _devices.clear();
    _devicesController.add(_devices);

    final localIp = await getLocalIp();
    if (localIp == null) {
      debugPrint('❌ Could not determine local IP');
      _isScanning = false;
      return;
    }

    final subnet = getSubnet(localIp);
    if (subnet == null) {
      debugPrint('❌ Could not determine subnet');
      _isScanning = false;
      return;
    }

    debugPrint('🔍 Starting subnet scan: $subnet.1-254 on port $port');
    debugPrint('📍 Local IP: $localIp');

    // Scan all IPs in parallel with batching to avoid overwhelming the network
    const batchSize = 25;
    for (int start = 1; start <= 254; start += batchSize) {
      final futures = <Future<void>>[];
      for (int i = start; i < start + batchSize && i <= 254; i++) {
        final targetIp = '$subnet.$i';
        // Skip our own IP
        if (targetIp == localIp) continue;
        futures.add(_probeHost(targetIp, port));
      }
      await Future.wait(futures);
    }

    _isScanning = false;
    debugPrint('✅ Scan complete. Found ${_devices.length} devices.');
    _devicesController.add(_devices);
  }

  /// Probe a single host to check if it's an AnyDrop device
  Future<void> _probeHost(String ip, int port) async {
    try {
      // First, check if port is open with a socket connection
      final socket = await Socket.connect(
        ip,
        port,
        timeout: connectionTimeout,
      );
      socket.destroy();

      // Port is open, now verify it's an AnyDrop server
      final identity = await _identifyDevice(ip, port);
      if (identity != null) {
        final device = ScannedDevice(
          id: '$ip:$port',
          name: identity['name'] ?? 'Unknown Device',
          icon: identity['icon'] ?? 'monitor',
          ip: ip,
          port: port,
          type: identity['type'] ?? 'DESKTOP',
        );
        _devices.add(device);
        _devicesController.add(_devices);
        debugPrint('✅ Found AnyDrop device: ${device.name} @ $ip:$port');
      }
    } on SocketException {
      // Port closed or host unreachable - ignore
    } on TimeoutException {
      // Timeout - ignore
    } catch (e) {
      // Other errors - ignore silently
    }
  }

  /// Call /api/identify to verify if the host is an AnyDrop device
  Future<Map<String, dynamic>?> _identifyDevice(String ip, int port) async {
    try {
      final uri = Uri.parse('http://$ip:$port/api/identify');
      final response = await http.get(uri).timeout(httpTimeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Verify it's an AnyDrop server
        if (data['app'] == 'AnyDrop') {
          return data;
        }
      }
    } catch (e) {
      // HTTP request failed - not an AnyDrop server
    }
    return null;
  }

  /// Manually add a device by IP
  Future<ScannedDevice?> addManualDevice(String ip, {int port = defaultPort}) async {
    debugPrint('🔍 Manually probing $ip:$port...');
    final identity = await _identifyDevice(ip, port);
    if (identity != null) {
      final device = ScannedDevice(
        id: '$ip:$port',
        name: identity['name'] ?? 'Unknown Device',
        icon: identity['icon'] ?? 'monitor',
        ip: ip,
        port: port,
        type: identity['type'] ?? 'DESKTOP',
      );

      // Avoid duplicates
      _devices.removeWhere((d) => d.id == device.id);
      _devices.add(device);
      _devicesController.add(_devices);
      debugPrint('✅ Manually added: ${device.name} @ $ip:$port');
      return device;
    }
    debugPrint('❌ No AnyDrop server found at $ip:$port');
    return null;
  }

  void dispose() {
    _devicesController.close();
  }
}
