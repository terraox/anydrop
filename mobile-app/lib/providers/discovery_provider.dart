import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:nsd/nsd.dart' as nsd;
import '../services/subnet_scanner_service.dart';

/// Represents a device discovered on the local network
class DiscoveredDevice {
  final String id;
  final String name;
  final String icon;
  final String ip;
  final int port;
  final String type;

  DiscoveredDevice({
    required this.id,
    required this.name,
    required this.icon,
    required this.ip,
    required this.port,
    this.type = 'DESKTOP',
  });

  @override
  String toString() => 'DiscoveredDevice($name @ $ip:$port)';
}

/// Hybrid Discovery Provider
/// Uses mDNS first, then falls back to subnet scanning if no devices found
class DiscoveryProvider extends ChangeNotifier {
  final List<DiscoveredDevice> _devices = [];
  final SubnetScannerService _subnetScanner = SubnetScannerService();
  nsd.Discovery? _discovery;
  bool _isScanning = false;
  String? _error;
  Timer? _fallbackTimer;

  static const String serviceType = '_anydrop._tcp';
  static const Duration mdnsFallbackTimeout = Duration(seconds: 5);

  List<DiscoveredDevice> get devices => List.unmodifiable(_devices);
  bool get isScanning => _isScanning;
  String? get error => _error;
  SubnetScannerService get subnetScanner => _subnetScanner;

  DiscoveryProvider() {
    // Listen to subnet scanner updates
    _subnetScanner.devicesStream.listen((scannedDevices) {
      for (final scanned in scannedDevices) {
        _addDeviceIfNew(DiscoveredDevice(
          id: scanned.id,
          name: scanned.name,
          icon: scanned.icon,
          ip: scanned.ip,
          port: scanned.port,
          type: scanned.type,
        ));
      }
    });
  }

  /// Start discovering AnyDrop services
  /// First tries mDNS, then falls back to subnet scanning
  Future<void> startScanning() async {
    if (_isScanning) return;

    _isScanning = true;
    _error = null;
    _devices.clear();
    notifyListeners();

    // Try mDNS first
    try {
      _discovery = await nsd.startDiscovery(serviceType);
      _discovery!.addServiceListener((service, status) {
        _handleMdnsUpdate(service, status);
      });
      debugPrint('📡 mDNS Discovery started for $serviceType');

      // Set fallback timer - if no mDNS devices found, start subnet scan
      _fallbackTimer = Timer(mdnsFallbackTimeout, () {
        if (_devices.isEmpty) {
          debugPrint('⚠️ No mDNS devices found, starting subnet scan...');
          _startSubnetScan();
        }
      });
    } catch (e) {
      debugPrint('❌ mDNS failed: $e, starting subnet scan...');
      _startSubnetScan();
    }
  }

  void _handleMdnsUpdate(nsd.Service service, nsd.ServiceStatus status) {
    if (status == nsd.ServiceStatus.found) {
      _addMdnsDevice(service);
    } else if (status == nsd.ServiceStatus.lost) {
      _removeDevice(service.name ?? '');
    }
  }

  void _addMdnsDevice(nsd.Service service) {
    if (service.host == null) return;

    final txt = service.txt ?? {};
    String decodeText(String key) {
      final value = txt[key];
      if (value == null) return '';
      if (value is List<int>) return String.fromCharCodes(value);
      return value.toString();
    }

    final name = decodeText('name').isNotEmpty
        ? decodeText('name')
        : (service.name ?? 'Unknown Device');
    final icon = decodeText('icon').isNotEmpty ? decodeText('icon') : 'monitor';
    final type = decodeText('type').isNotEmpty ? decodeText('type') : 'DESKTOP';

    _addDeviceIfNew(DiscoveredDevice(
      id: service.name ?? name,
      name: name,
      icon: icon,
      ip: service.host!,
      port: service.port ?? 8080,
      type: type,
    ));
  }

  void _addDeviceIfNew(DiscoveredDevice device) {
    final existingIndex = _devices.indexWhere((d) => d.ip == device.ip);
    if (existingIndex >= 0) {
      _devices[existingIndex] = device;
    } else {
      _devices.add(device);
    }
    debugPrint('✅ Device found: ${device.name} @ ${device.ip}:${device.port}');
    notifyListeners();
  }

  void _removeDevice(String id) {
    _devices.removeWhere((d) => d.id == id);
    notifyListeners();
  }

  Future<void> _startSubnetScan() async {
    await _subnetScanner.scanNetwork();
  }

  /// Force subnet scan (manual trigger)
  Future<void> forceSubnetScan() async {
    debugPrint('🔍 Force starting subnet scan...');
    _isScanning = true;
    notifyListeners();
    await _subnetScanner.scanNetwork();
    _isScanning = false;
    notifyListeners();
  }

  /// Manually add a device by IP
  Future<bool> addManualDevice(String ip, {int port = 8080}) async {
    final result = await _subnetScanner.addManualDevice(ip, port: port);
    if (result != null) {
      _addDeviceIfNew(DiscoveredDevice(
        id: result.id,
        name: result.name,
        icon: result.icon,
        ip: result.ip,
        port: result.port,
        type: result.type,
      ));
      return true;
    }
    return false;
  }

  Future<void> stopScanning() async {
    _fallbackTimer?.cancel();
    if (_discovery != null) {
      await nsd.stopDiscovery(_discovery!);
      _discovery = null;
    }
    _isScanning = false;
    notifyListeners();
  }

  Future<void> refresh() async {
    await stopScanning();
    await startScanning();
  }

  @override
  void dispose() {
    _fallbackTimer?.cancel();
    stopScanning();
    _subnetScanner.dispose();
    super.dispose();
  }
}
