import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:device_info_plus/device_info_plus.dart';
import '../core/utils/device_utils.dart';
import '../models/device.dart';
import '../models/file_transfer.dart';
import '../services/websocket_service.dart';
import '../services/broadcast_service.dart';
import '../services/http_server_service.dart';
import '../services/file_stream_service.dart';
import 'discovery_provider.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';

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
  final HttpServerService _httpServer; // Injected
  final FileStreamService _fileStreamService = FileStreamService();
  final DiscoveryProvider _discoveryProvider = DiscoveryProvider();

  String _deviceName = '';
  String _deviceIcon = 'smartphone';
  String _deviceId = '';
  String? _myIp; // Store our local IP for filtering
  QuickSaveMode _quickSaveMode = QuickSaveMode.off;
  bool _isScanning = false;
  bool _isConnected = false;
  FileTransfer? _incomingTransfer;
  double _transferProgress = 0.0;
  bool _isTransferring = false;

  // Getters
  String get deviceName => _deviceName;
  String get deviceIcon => _deviceIcon;
  String get deviceId => _deviceId;
  QuickSaveMode get quickSaveMode => _quickSaveMode;
  bool get isScanning => _isScanning || _discoveryProvider.isScanning;
  bool get isConnected => _isConnected;
  FileTransfer? get incomingTransfer => _incomingTransfer;
  double get transferProgress => _transferProgress;
  bool get isTransferring => _isTransferring;
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
          ip: d.ip,
          port: d.port,
          lastSeen: DateTime.now(),
        ))
        .toList();

    return mdnsDevices;
  }

  DeviceProvider(this._httpServer) {
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
      deviceId: _deviceId,
    );
    
    // Start discovering other devices
    await _discoveryProvider.startScanning();
  }

  void _setupWebSocketListeners() {
    // IMPORTANT: Receiver should NOT create WebSocket clients
    // Receiver only hosts HTTP server to receive files
    // WebSocket clients are only for senders connecting to receivers
    // For local file transfer, we don't need WebSocket - files come via HTTP POST /upload
    // 
    // NO WebSocket connections should be created here - receiver only hosts HTTP server
    // _wsService (STOMP) is NOT used for local file transfer
    debugPrint('✅ Receiver mode: HTTP server only, no WebSocket client connections');
    debugPrint('   Files are received via HTTP POST /upload');
    debugPrint('   STOMP WebSocket service (_wsService) is NOT used for local file transfer');
    _isConnected = true; // Mark as connected since HTTP server is running
    notifyListeners();
    
    // DISABLED - Receiver must NEVER create WebSocket clients
    // All WebSocket client creation removed for receiver
    // _wsService is kept for other features (trackpad, etc.) but NOT for file transfer
  }

  void _setupTransferListener() {
    // DISABLED - Files are received via HTTP POST /upload, not WebSocket
    // The HTTP server (HttpServerService) handles incoming file transfers
    debugPrint('⚠️ WebSocket transfer listener disabled - using HTTP for file reception');
    
    /* DISABLED - Use HTTP instead
    _wsService.subscribe('/user/queue/transfers', (frame) {
      if (frame.body != null) {
        try {
          final data = jsonDecode(frame.body!);
          final transfer = FileTransfer.fromJson(data);
          
          // Check if this transfer is for us
          debugPrint('📥 Received transfer request: ${transfer.name} for ${transfer.targetDeviceId}');
          
          if (transfer.targetDeviceId != null && 
              transfer.targetDeviceId != _deviceId) {
            debugPrint('🚫 Ignoring transfer for different device: ${transfer.targetDeviceId}');
            return; // Not for us
          }
          
          _incomingTransfer = transfer;
          notifyListeners();
          debugPrint('✅ Incoming transfer accepted for prompt: ${transfer.name}');
        } catch (e) {
          debugPrint('❌ Error parsing transfer request: $e');
        }
      }
    });
    */
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
      'id': _deviceId,
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
      deviceId: _deviceId,
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
      deviceId: _deviceId,
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
  
  void clearIncomingTransfer() {
    _incomingTransfer = null;
    notifyListeners();
  }

  Future<void> acceptTransfer() async {
    if (_incomingTransfer != null) {
      final transfer = _incomingTransfer!;
      
      // Logic to accept transfer - sending response back to sender
      final response = {
        'transferId': transfer.id,
        'accepted': true,
        'targetDeviceId': _deviceId
      };
      _wsService.send('/app/transfer.response', response);
      
      // Start Streaming Receive
      _isTransferring = true;
      _transferProgress = 0.0;
      notifyListeners();
      
      // Request permission
      var status = await Permission.storage.request();
       if (status.isDenied) {
        status = await Permission.manageExternalStorage.request();
      }
      
      if (status.isGranted || await Permission.storage.isGranted || await Permission.manageExternalStorage.isGranted) {
           // DISABLED - FileStreamService uses WebSocket which is disabled for file transfer
           // Files are received via HTTP POST /upload, not WebSocket
           debugPrint('❌ FileStreamService.receiveFile() is disabled');
           debugPrint('   Files are received via HTTP POST /upload handler in HttpServerService');
           debugPrint('   TransferService._handleHttpTransfer() handles incoming files');
           
           /* DISABLED - Use HTTP POST /upload instead
           _fileStreamService.onProgress = (progress) {
              _transferProgress = progress;
              notifyListeners();
           };
           
           _fileStreamService.onComplete = (path) {
              _isTransferring = false;
              _transferProgress = 1.0;
              notifyListeners();
              debugPrint("✅ Transfer Complete: $path");
           };
           
           _fileStreamService.onError = (error) {
              _isTransferring = false;
              notifyListeners();
              debugPrint("❌ Transfer Error: $error");
           };

           await _fileStreamService.receiveFile(transfer.id, transfer.name, transfer.sizeBytes);
           */
      } else {
        debugPrint("❌ Permission Denied");
        _isTransferring = false;
        notifyListeners();
      }
      
      // Clear dialog immediately (UI handles progress elsewhere?)
      _incomingTransfer = null; 
      notifyListeners();
    }
  }

  // Removed _downloadFile as we use FileStreamService now

  void rejectTransfer() {
     if (_incomingTransfer != null) {
      final response = {
        'transferId': _incomingTransfer!.id,
        'accepted': false,
        'targetDeviceId': _deviceId
      };
      _wsService.send('/app/transfer.response', response);
      _incomingTransfer = null;
      notifyListeners();
    }
  }

  void refreshDevices() {
    startScanning();
  }

  /// Connect to a specific device using its discovered IP
  Future<void> connectToDevice(String ip, int port, {String? token}) async {
    // DISABLED - Receiver should NOT create WebSocket connections
    // This method is for senders only, not receivers
    // Receiver only hosts HTTP server - files are received via HTTP POST /upload
    debugPrint('⚠️ connectToDevice() disabled for receiver');
    debugPrint('   Receiver hosts HTTP server only - no WebSocket client needed');
    // Do nothing - receiver does not connect to WebSocket
  }

  Future<void> connectToServer({String? token}) async {
    // IMPORTANT: Receiver should NOT connect to WebSocket servers
    // Receiver only hosts HTTP server - files are received via HTTP POST /upload
    // This method is for connecting to main server, not for local file transfer
    debugPrint('⚠️ connectToServer() disabled for local file transfer');
    debugPrint('   Receiver hosts HTTP server only - no WebSocket client needed');
    _isConnected = true; // HTTP server is running
    notifyListeners();
    
    // DISABLED for local file transfer
    // _wsService.connect(token: token);
  }

  void disconnectFromServer() {
    // Receiver doesn't need to disconnect - HTTP server stays running
    debugPrint('⚠️ disconnectFromServer() - HTTP server remains running for file reception');
    // _wsService.disconnect();
  }

  @override
  void dispose() {
    _discoveryProvider.dispose();
    _broadcastService.stopBroadcasting();
    // Note: _wsService is not used for local file transfer, but dispose it anyway for cleanup
    _wsService.dispose();
    super.dispose();
  }
}
