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
  Future<void> sendFile(String transferId, File file) async {
    try {
      final wsUrl = ApiConstants.baseUrl.replaceFirst('http', 'ws') + '/stream';
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
  }

  /// Start Receiving a File
  Future<void> receiveFile(String transferId, String fileName, int fileSize) async {
    try {
      final wsUrl = ApiConstants.baseUrl.replaceFirst('http', 'ws') + '/stream';
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
            
            // Open it?
            // OpenFile.open(tempFile.path);
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
  }

  void cancel() {
    _subscription?.cancel();
    _channel?.sink.close();
  }
}
