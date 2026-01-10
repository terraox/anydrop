import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;
import 'package:path_provider/path_provider.dart';
import '../core/constants/api_constants.dart';

class FileStreamService {
  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  
  // Callbacks
  Function(double)? onProgress;
  Function(String)? onComplete;
  Function(String)? onError;
  
  /// Start Sending a File
  /// DEPRECATED: This uses WebSocket for file transfer. Use HTTP streaming instead.
  /// File transfers should use HTTP POST /upload with discovered device IP.
  /// 
  /// DISABLED: This method is completely disabled - do not use WebSocket for file transfer.
  /// Use TransferService.sendFile() which uses HTTP POST /upload instead.
  @Deprecated('Use TransferService.sendFile() with HTTP POST /upload instead. WebSocket file transfer is disabled.')
  Future<void> sendFile(String transferId, File file, {String? deviceIp, int? devicePort}) async {
    // COMPLETELY DISABLED - Do not create WebSocket connections for file transfer
    debugPrint('❌ ERROR: WebSocket file transfer is disabled.');
    debugPrint('   Use TransferService.sendFile() which uses HTTP POST /upload instead.');
    if (onError != null) {
      onError!('WebSocket file transfer is disabled. Use HTTP POST /upload via TransferService.sendFile()');
    }
    return;
    
    /* DISABLED - Do not use WebSocket for file transfer
    try {
      // IMPORTANT: File transfers should use HTTP, not WebSocket
      // This method is kept for backward compatibility but should not be used
      debugPrint('⚠️ WARNING: Using WebSocket for file transfer is deprecated.');
      debugPrint('   Use HTTP POST /upload with discovered device IP instead.');
      
      String wsUrl;
      if (deviceIp != null && devicePort != null) {
        // Use discovered device IP
        wsUrl = 'ws://$deviceIp:$devicePort/stream';
      } else {
        // Fallback (deprecated)
        wsUrl = ApiConstants.baseUrl.replaceFirst('http', 'ws') + '/stream';
        debugPrint('❌ ERROR: No device IP provided. File transfer will fail.');
        if (onError != null) onError!('Device IP required for file transfer');
        return;
      }
      
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      
      // 1. Handshake (SENDER role)
      _channel!.sink.add('SENDER:$transferId');
      
      final fileSize = await file.length();
      int bytesSent = 0;
      bool isStreaming = false;
      
      _subscription = _channel!.stream.listen((message) async {
        if (message == 'START') {
           debugPrint('🚀 Stream Start Signal Received. Sending bytes...');
           isStreaming = true;
           
           // Open File Stream
           final stream = file.openRead();
           await for (List<int> chunk in stream) {
             if (_channel == null) break;
             _channel!.sink.add(chunk);
             bytesSent += chunk.length;
             
             if (onProgress != null) {
               onProgress!(bytesSent / fileSize);
             }
             
             // Optional: Throttle locally if needed, but backend handles it.
             // Allow UI to breathe
             await Future.delayed(Duration.zero);
           }
           
           debugPrint('✅ File Sent!');
           _channel!.sink.close(status.normalClosure);
           if (onComplete != null) onComplete!(file.path);
        }
      }, onError: (e) {
        if (onError != null) onError!(e.toString());
      }, onDone: () {
        debugPrint('WebSocket Closed');
      });
      
    } catch (e) {
      if (onError != null) onError!(e.toString());
    }
    */
  }

  /// Start Receiving a File
  /// DEPRECATED: This uses WebSocket for file transfer. Use HTTP streaming instead.
  /// File transfers should use HTTP POST /upload with discovered device IP.
  /// 
  /// DISABLED: This method is completely disabled - receiver does not create WebSocket connections.
  /// Receiver only hosts HTTP server - files are received via HTTP POST /upload.
  @Deprecated('Receiver does not create WebSocket connections. Files are received via HTTP POST /upload.')
  Future<void> receiveFile(String transferId, String fileName, int fileSize, {String? deviceIp, int? devicePort}) async {
    // COMPLETELY DISABLED - Receiver does not create WebSocket connections
    debugPrint('❌ ERROR: Receiver does not create WebSocket connections.');
    debugPrint('   Receiver only hosts HTTP server - files are received via HTTP POST /upload.');
    if (onError != null) {
      onError!('Receiver does not create WebSocket connections. Files are received via HTTP POST /upload.');
    }
    return;
    
    /* DISABLED - Receiver does not create WebSocket connections
    try {
      // IMPORTANT: File transfers should use HTTP, not WebSocket
      debugPrint('⚠️ WARNING: Using WebSocket for file transfer is deprecated.');
      
      String wsUrl;
      if (deviceIp != null && devicePort != null) {
        // Use discovered device IP
        wsUrl = 'ws://$deviceIp:$devicePort/stream';
      } else {
        // Fallback (deprecated)
        wsUrl = ApiConstants.baseUrl.replaceFirst('http', 'ws') + '/stream';
        debugPrint('❌ ERROR: No device IP provided. File transfer will fail.');
        if (onError != null) onError!('Device IP required for file transfer');
        return;
      }
      
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      
      // 1. Handshake (RECEIVER role)
      _channel!.sink.add('RECEIVER:$transferId');
      
      // Prepare File Sink
      IOSink? fileSink;
      File? tempFile;
      int bytesReceived = 0;
      
      // Get Path (Downloads)
      Directory? directory;
      if (Platform.isAndroid) {
        directory = Directory('/storage/emulated/0/Download');
      } else {
        directory = await getApplicationDocumentsDirectory();
      }
      
      if (!directory.existsSync()) {
         directory = await getExternalStorageDirectory();
      }
      
      tempFile = File('${directory!.path}/$fileName');
      fileSink = tempFile.openWrite();
      
      _subscription = _channel!.stream.listen((message) {
        if (message is String) {
          if (message == 'START') {
            debugPrint('🚀 Stream Start Signal Received. Waiting for bytes...');
          }
        } else if (message is List<int>) {
          // Binary Data
          fileSink?.add(message);
          bytesReceived += message.length;
          
          if (onProgress != null) {
             onProgress!(bytesReceived / fileSize);
          }
          
          if (bytesReceived >= fileSize) {
            debugPrint('✅ File Download Complete!');
            fileSink?.close();
            _channel!.sink.close(status.normalClosure);
            if (onComplete != null) onComplete!(tempFile!.path);
          }
        }
      }, onError: (e) {
        debugPrint('❌ Stream Error: $e');
        fileSink?.close();
        if (onError != null) onError!(e.toString());
      }, onDone: () {
        fileSink?.close();
      });
      
    } catch (e) {
      if (onError != null) onError!(e.toString());
    }
    */
  }

  void cancel() {
    _subscription?.cancel();
    _channel?.sink.close();
  }
}
