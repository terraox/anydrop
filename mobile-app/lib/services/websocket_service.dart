import 'dart:async';
import 'dart:convert';
import 'package:stomp_dart_client/stomp_dart_client.dart';
import '../core/constants/api_constants.dart';

/// WebSocket service using STOMP protocol
/// 
/// IMPORTANT: This service uses STOMP and is NOT used for local file transfer.
/// Local file transfer uses plain WebSocket via TransferService.connectToReceiver().
/// This service is kept for other features (trackpad, etc.) but NOT for file transfer.
class WebSocketService {
  StompClient? _client;
  
  final _messageController = StreamController<dynamic>.broadcast();
  final _connectionController = StreamController<bool>.broadcast();
  
  bool _isConnected = false;

  /// Stream of incoming messages (generic)
  Stream<dynamic> get messages => _messageController.stream;
  
  /// Stream of connection status changes
  Stream<bool> get connectionStatus => _connectionController.stream;
  
  /// Current connection status
  bool get isConnected => _isConnected;

  StompClient? get client => _client;

  /// Connect to the WebSocket server
  /// IMPORTANT: This service uses STOMP and is NOT used for local file transfer.
  /// For local file transfer, use TransferService.connectToReceiver() with discovered device IP.
  /// This method is for connecting to the main server, not for local file transfer.
  /// 
  /// DISABLED for local file transfer - do not use this for file transfers.
  void connect({String? token, String? deviceIp, int? devicePort}) {
    if (_isConnected) return;

    // VALIDATE: For local file transfer, device IP/port MUST be provided
    // Do not allow fallback to hardcoded localhost
    if (deviceIp == null || devicePort == null) {
      print('❌ ERROR: deviceIp and devicePort are required for WebSocket connection');
      print('   Do not use hardcoded localhost - use discovered device IP from mDNS');
      print('   For local file transfer, use TransferService.connectToReceiver() instead');
      return;
    }

    // VALIDATE: Do not allow localhost
    if (deviceIp == 'localhost' || deviceIp == '127.0.0.1') {
      print('❌ ERROR: Cannot use localhost for WebSocket connection');
      print('   Use discovered device IP from mDNS instead');
      return;
    }

    // Use discovered device IP from mDNS (never localhost)
    // Use single path /ws (not /ws/transfer or /ws/stream)
    final wsUrl = 'ws://$deviceIp:$devicePort/ws';
    print('🔌 Connecting to WebSocket at discovered device: $wsUrl');
    print('   ✅ Using discovered IP from mDNS (not localhost)');
    print('   ✅ Single WebSocket path: /ws');

    _client = StompClient(
      config: StompConfig(
        url: wsUrl,
        onConnect: _onConnect,
        onWebSocketError: (dynamic error) => _onError(error),
        onStompError: (dynamic error) => _onError(error),
        onDisconnect: (dynamic _) => _onDisconnect(),
        stompConnectHeaders: token != null ? {'Authorization': 'Bearer $token'} : {},
        webSocketConnectHeaders: token != null ? {'Authorization': 'Bearer $token'} : {},
      ),
    );

    _client!.activate();
  }

  void _onConnect(StompFrame frame) {
    _isConnected = true;
    _connectionController.add(true);
    print('✅ WebSocket Connected');
  }

  void _onError(dynamic error) {
    print('❌ WebSocket Error: $error');
    _isConnected = false;
    _connectionController.add(false);
  }

  void _onDisconnect() {
    print('⚠️ WebSocket Disconnected');
    _isConnected = false;
    _connectionController.add(false);
  }

  void disconnect() {
    _client?.deactivate();
    _isConnected = false;
    _connectionController.add(false);
  }

  /// Subscribe to a topic
  void subscribe(String destination, Function(StompFrame) callback) {
    _client?.subscribe(
      destination: destination,
      callback: callback,
    );
  }

  /// Send a JSON message to a destination
  void send(String destination, Map<String, dynamic> body) {
    if (!_isConnected || _client == null) return;
    _client!.send(
      destination: destination,
      body: jsonEncode(body),
    );
  }

  void sendTrackpadData(double x, double y) {
    send('/app/input/trackpad', {'x': x, 'y': y});
  }

  void sendSentryAlert(double magnitude) {
    send('/app/sentry/alert', {'magnitude': magnitude});
  }

  /// Connect to a specific device using discovered IP from mDNS
  /// IMPORTANT: This service uses STOMP and is NOT used for local file transfer.
  /// For local file transfer, use TransferService.connectToReceiver() instead.
  /// 
  /// This method is kept for other features (trackpad, etc.) but NOT for file transfer.
  void connectToDevice(String deviceIp, int devicePort, {String? token}) {
    // VALIDATE: Do not allow localhost
    if (deviceIp == 'localhost' || deviceIp == '127.0.0.1') {
      print('❌ ERROR: Cannot use localhost for WebSocket connection');
      print('   Use discovered device IP from mDNS instead');
      return;
    }
    
    disconnect(); // Disconnect existing connection first
    connect(token: token, deviceIp: deviceIp, devicePort: devicePort);
  }

  void dispose() {
    disconnect();
    _messageController.close();
    _connectionController.close();
  }
}
