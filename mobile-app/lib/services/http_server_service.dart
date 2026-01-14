import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:shelf/shelf.dart' as shelf;
import 'package:shelf/shelf_io.dart' as shelf_io;
import 'package:shelf_web_socket/shelf_web_socket.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

/// HTTP Server Service for phone
/// Runs a minimal HTTP server on port 8080 to respond to /api/identify requests
/// This allows web apps to discover the phone via subnet scanning
class HttpServerService {
  HttpServer? _server;
  bool _isRunning = false;

  bool get isRunning => _isRunning;

  /// Callback for incoming file transfers
  Future<shelf.Response> Function(shelf.Request)? onFileTransfer;

  /// Callback for incoming WebSocket connections
  void Function(WebSocketChannel, String)? onWebSocketConnect;

  /// Start the HTTP server on port 8080
  Future<void> startServer({
    required String deviceName,
    required String deviceIcon,
    String? deviceId,
  }) async {
    if (_isRunning) return;

    try {
      // Create a handler that responds to /api/identify and /api/files/transfer
      final handler = const shelf.Pipeline()
          // ❌ REMOVE logRequests() as it consumes the request body stream!
          // .addMiddleware(shelf.logRequests()) 
          .addMiddleware(_corsMiddleware())
          .addHandler((request) async {
        if (request.url.path == 'api/identify') {
          // Return device identity including the deviceId for transfer routing
          final response = {
            'app': 'AnyDrop',
            'name': deviceName,
            'icon': deviceIcon,
            'type': 'PHONE',
            'version': '1.0.0',
            'id': deviceId, // Include device ID for frontend discovery
            'deviceId': deviceId, // Alternative key for compatibility
          };

          return shelf.Response.ok(
            jsonEncode(response),
            headers: {'Content-Type': 'application/json'},
          );
        }

        // Handle file upload (receiver receives files via HTTP POST /upload)
        if (request.url.path == 'upload' && request.method == 'POST') {
          if (onFileTransfer != null) {
            return await onFileTransfer!(request);
          }
          return shelf.Response.internalServerError(body: 'No transfer handler registered');
        }
        
        // Legacy endpoint for compatibility
        if (request.url.path == 'api/files/transfer' && request.method == 'POST') {
          if (onFileTransfer != null) {
            return await onFileTransfer!(request);
          }
          return shelf.Response.internalServerError(body: 'No transfer handler registered');
        }

        // Handle WebSocket signaling (receiver hosts /ws server)
        if (request.url.path == 'ws' || request.url.path == '/ws') {
          debugPrint('🔌 Incoming WS request on /ws');
          return webSocketHandler((WebSocketChannel webSocket) {
            debugPrint('✅ WebSocket connection established');
            if (onWebSocketConnect != null) {
              final clientIp = request.context['shelf.io.connection_info'] as HttpConnectionInfo?;
              onWebSocketConnect!(webSocket, clientIp?.remoteAddress.address ?? 'unknown');
            }
          })(request);
        }

        // 404 for other paths
        return shelf.Response.notFound('Not Found');
      });

      // Start server on port 8080
      _server = await shelf_io.serve(handler, InternetAddress.anyIPv4, 8080);
      _isRunning = true;

      debugPrint('🌐 HTTP Server started on port 8080');
    } catch (e) {
      debugPrint('❌ Failed to start HTTP server: $e');
      _isRunning = false;
    }
  }

  /// Update the device name/icon (restart server)
  Future<void> updateDevice({
    required String deviceName,
    required String deviceIcon,
    String? deviceId,
  }) async {
    await stopServer();
    await startServer(deviceName: deviceName, deviceIcon: deviceIcon, deviceId: deviceId);
  }

  /// Stop the HTTP server
  Future<void> stopServer() async {
    if (_server != null) {
      await _server!.close(force: true);
      _server = null;
      _isRunning = false;
      debugPrint('🛑 HTTP Server stopped');
    }
  }

  /// CORS middleware to allow cross-origin requests
  shelf.Middleware _corsMiddleware() {
    return (shelf.Handler handler) {
      return (shelf.Request request) async {
        if (request.method == 'OPTIONS') {
          return shelf.Response.ok('', headers: _corsHeaders);
        }

        final response = await handler(request);
        return response.change(headers: _corsHeaders);
      };
    };
  }

  final _corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
}
