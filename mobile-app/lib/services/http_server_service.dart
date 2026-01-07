import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:shelf/shelf.dart' as shelf;
import 'package:shelf/shelf_io.dart' as shelf_io;

/// HTTP Server Service for phone
/// Runs a minimal HTTP server on port 8080 to respond to /api/identify requests
/// This allows web apps to discover the phone via subnet scanning
class HttpServerService {
  HttpServer? _server;
  bool _isRunning = false;

  bool get isRunning => _isRunning;

  /// Start the HTTP server on port 8080
  Future<void> startServer({
    required String deviceName,
    required String deviceIcon,
  }) async {
    if (_isRunning) return;

    try {
      // Create a handler that responds to /api/identify
      final handler = const shelf.Pipeline()
          .addMiddleware(shelf.logRequests())
          .addMiddleware(_corsMiddleware())
          .addHandler((request) {
        if (request.url.path == 'api/identify') {
          // Return device identity
          final response = {
            'app': 'AnyDrop',
            'name': deviceName,
            'icon': deviceIcon,
            'type': 'PHONE',
            'version': '1.0.0',
          };

          return shelf.Response.ok(
            jsonEncode(response),
            headers: {'Content-Type': 'application/json'},
          );
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
  }) async {
    await stopServer();
    await startServer(deviceName: deviceName, deviceIcon: deviceIcon);
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
