import 'dart:async';
import 'dart:convert';
import 'package:stomp_dart_client/stomp_dart_client.dart';
import '../core/constants/api_constants.dart';

/// WebSocket service using STOMP protocol
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
  void connect({String? token}) {
    if (_isConnected) return;

    // "http://IP:8080/ws" -> "ws://IP:8080/ws"
    // ApiConstants.baseUrl is http://...
    String wsUrl = ApiConstants.baseUrl.replaceFirst('http', 'ws') + '/ws';

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

  void dispose() {
    disconnect();
    _messageController.close();
    _connectionController.close();
  }
}
