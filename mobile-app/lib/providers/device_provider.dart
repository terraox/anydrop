import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:device_info_plus/device_info_plus.dart';
import '../core/utils/device_utils.dart';
import '../models/device.dart';
import '../services/websocket_service.dart';
import '../services/broadcast_service.dart';
import '../services/http_server_service.dart';
import 'discovery_provider.dart';

/// Quick save mode for automatic file saving
enum QuickSaveMode { off, favourites, on }

/// Device provider for managing nearby devices and device settings
/// Now integrates mDNS discovery for P2P local network device finding
class DeviceProvider extends ChangeNotifier {
  static const String _deviceNameKey = 'anydrop_device_name';
  static const String _deviceIconKey = 'anydrop_device_icon';
  static const String _deviceIdKey = 'anydrop_device_id';
  static const String _quickSaveKey = 'anydrop_quick_save';

  final WebSocketService _wsService = WebSocketService();
  final BroadcastService _broadcastService = BroadcastService();
  final HttpServerService _httpServer = HttpServerService();
  final DiscoveryProvider _discoveryProvider = DiscoveryProvider();

  String _deviceName = '';
  String _deviceIcon = 'smartphone';
  String _deviceId = '';
  String? _myIp; // Store our local IP for filtering
  QuickSaveMode _quickSaveMode = QuickSaveMode.off;
  bool _isScanning = false;
  bool _isConnected = false;

  // Getters
  String get deviceName => _deviceName;
  String get deviceIcon => _deviceIcon;
  String get deviceId => _deviceId;
  QuickSaveMode get quickSaveMode => _quickSaveMode;
  bool get isScanning => _isScanning || _discoveryProvider.isScanning;
  bool get isConnected => _isConnected;
  WebSocketService get wsService => _wsService;
  DiscoveryProvider get discoveryProvider => _discoveryProvider;

  /// Get combined list of devices from both mDNS and WebSocket
  /// Excludes the phone's own IP from the list
  List<Device> get nearbyDevices {
    // Convert mDNS discovered devices to the Device model, filtering out our own IP
    final mdnsDevices = _discoveryProvider.devices
        .where((d) => _myIp == null || d.ip != _myIp) // Filter out our own device
        .map((d) => Device(
          id: d.id,
          name: d.name,
          model: 'Unknown',
          type: d.type,
          status: DeviceStatus.online,
          batteryLevel: 100,
          deviceIcon: d.icon,
          lastSeen: DateTime.now(),
        ))
        .toList();

    return mdnsDevices;
  }

  DeviceProvider() {
    _initialize();
  }

  Future<void> _initialize() async {
    await _loadSettings();
    
    // Get our local IP for filtering
    _myIp = await _discoveryProvider.subnetScanner.getLocalIp();
    debugPrint('📍 My IP: $_myIp');
    
    _setupDiscoveryListener();
    _setupWebSocketListeners();
    
    // Start mDNS broadcast and discovery
    await _startMDNS();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _deviceName = prefs.getString(_deviceNameKey) ?? '';
    _deviceIcon = prefs.getString(_deviceIconKey) ?? 'smartphone';
    _deviceId = prefs.getString(_deviceIdKey) ?? '';

    if (_deviceName.isEmpty) {
      _deviceName = await DeviceUtils.getDeviceName();
      await prefs.setString(_deviceNameKey, _deviceName);
    }

    if (_deviceId.isEmpty) {
      _deviceId = DeviceUtils.generateDeviceId();
      await prefs.setString(_deviceIdKey, _deviceId);
    }
    
    final quickSave = prefs.getString(_quickSaveKey);
    if (quickSave != null) {
      _quickSaveMode = QuickSaveMode.values.firstWhere(
        (mode) => mode.name == quickSave,
        orElse: () => QuickSaveMode.off,
      );
    }
    notifyListeners();
  }

  void _setupDiscoveryListener() {
    // Listen to mDNS discovery changes
    _discoveryProvider.addListener(() {
      notifyListeners();
    });
  }

  Future<void> _startMDNS() async {
    // Start broadcasting this device
    await _broadcastService.startBroadcasting(
      name: _deviceName,
      iconType: _deviceIcon,
    );
    
    // Start HTTP server so web apps can discover this phone
    await _httpServer.startServer(
      deviceName: _deviceName,
      deviceIcon: _deviceIcon,
    );
    
    // Start discovering other devices
    await _discoveryProvider.startScanning();
  }

  void _setupWebSocketListeners() {
    _wsService.connectionStatus.listen((connected) {
      _isConnected = connected;
      if (connected) {
        _registerDevice();
      }
      notifyListeners();
    });
  }

  Future<void> _registerDevice() async {
    DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
    String model = "Unknown";
    String type = "PHONE";
    
    if (Platform.isAndroid) {
      AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
      model = androidInfo.model;
    } else if (Platform.isIOS) {
      IosDeviceInfo iosInfo = await deviceInfo.iosInfo;
      model = iosInfo.utsname.machine;
    }
    
    _wsService.send('/app/device.register', {
      'name': _deviceName,
      'model': model,
      'type': type,
      'batteryLevel': 90,
      'deviceIcon': _deviceIcon,
    });
  }

  Future<void> setDeviceName(String name) async {
    _deviceName = name;
    notifyListeners();
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_deviceNameKey, name);
    
    // Update mDNS broadcast with new name
    await _broadcastService.updateBroadcast(
      name: name,
      iconType: _deviceIcon,
    );
    
    // Update HTTP server with new name
    await _httpServer.updateDevice(
      deviceName: name,
      deviceIcon: _deviceIcon,
    );
    
    // Update WebSocket identity if connected
    if (_isConnected) {
      _wsService.send('/app/device.update', {
        'name': name,
        'model': 'Updated Model',
        'type': 'PHONE',
        'deviceIcon': _deviceIcon,
      });
    }
  }

  Future<void> setDeviceIcon(String icon) async {
    _deviceIcon = icon;
    notifyListeners();
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_deviceIconKey, icon);
    
    // Update mDNS broadcast
    await _broadcastService.updateBroadcast(
      name: _deviceName,
      iconType: icon,
    );
    
    // Update HTTP server
    await _httpServer.updateDevice(
      deviceName: _deviceName,
      deviceIcon: icon,
    );
  }

  Future<void> setQuickSaveMode(QuickSaveMode mode) async {
    _quickSaveMode = mode;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_quickSaveKey, mode.name);
  }

  void startScanning() {
    _isScanning = true;
    notifyListeners();
    
    // Refresh mDNS discovery
    _discoveryProvider.refresh();
    
    // After a short delay, also run subnet scan to find devices mDNS might miss
    Timer(const Duration(seconds: 2), () {
      // Always run subnet scan as a supplement to mDNS
      debugPrint('🔍 Starting subnet scan to find devices mDNS might miss...');
      _discoveryProvider.forceSubnetScan();
    });

    // Turn off scanning indicator after subnet scan should be done
    Timer(const Duration(seconds: 8), () {
      _isScanning = false;
      notifyListeners();
    });
  }

  void stopScanning() {
    _isScanning = false;
    notifyListeners();
  }

  void refreshDevices() {
    startScanning();
  }

  /// Connect to a specific device using its discovered IP
  Future<void> connectToDevice(String ip, int port, {String? token}) async {
    // For mDNS-discovered devices, we connect directly to their IP
    final wsUrl = 'ws://$ip:$port/ws';
    debugPrint('📡 Connecting to device at $wsUrl');
    // The WebSocket service can be extended to support direct connections
  }

  Future<void> connectToServer({String? token}) async {
    _wsService.connect(token: token);
  }

  void disconnectFromServer() {
    _wsService.disconnect();
  }

  @override
  void dispose() {
    _discoveryProvider.dispose();
    _broadcastService.stopBroadcasting();
    _wsService.dispose();
    super.dispose();
  }
}
