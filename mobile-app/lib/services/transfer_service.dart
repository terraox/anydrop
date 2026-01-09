import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import '../core/constants/api_constants.dart';

/// Unified Transfer Service for Handshake + Binary Streaming
class TransferService extends ChangeNotifier {
  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  
  String? _deviceId;
  bool _isConnected = false;
  
  // Transfer state
  String? _currentTransferId;
  String? _currentTargetId; // Target device ID for sending transfers
  File? _pendingSendFile; // File to send after ACCEPTED response
  IOSink? _fileSink;
  File? _receivingFile;
  int _totalBytes = 0;
  int _receivedBytes = 0;
  double _progress = 0.0;
  bool _isReceiving = false;
  bool _isSending = false;
  
  // Pending transfer request for UI
  Map<String, dynamic>? _pendingRequest;
  
  // Constants
  static const int CHUNK_SIZE = 64 * 1024; // 64KB chunks
  
  // Getters
  bool get isConnected => _isConnected;
  double get progress => _progress;
  bool get isReceiving => _isReceiving;
  bool get isSending => _isSending;
  Map<String, dynamic>? get pendingRequest => _pendingRequest;
  
  /// Connect to the unified transfer endpoint
  Future<void> connect(String deviceId) async {
    _deviceId = deviceId;
    
    try {
      final wsUrl = ApiConstants.baseUrl.replaceFirst('http', 'ws') + '/transfer';
      debugPrint('🔌 Connecting to $wsUrl');
      
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      _isConnected = true;
      
      // Register this device
      _send({
        'type': 'REGISTER',
        'deviceId': deviceId,
      });
      
      // Listen for messages
      _subscription = _channel!.stream.listen(
        _handleMessage,
        onError: (e) {
          debugPrint('❌ WebSocket Error: $e');
          _isConnected = false;
          notifyListeners();
        },
        onDone: () {
          debugPrint('🔌 WebSocket Closed');
          _isConnected = false;
          notifyListeners();
        },
      );
      
      notifyListeners();
    } catch (e) {
      debugPrint('❌ Connection failed: $e');
      _isConnected = false;
      notifyListeners();
    }
  }
  
  void _handleMessage(dynamic data) {
    if (data is String) {
      // JSON Message (Handshake)
      _handleTextMessage(data);
    } else if (data is List<int>) {
      // Binary Chunk
      _handleBinaryChunk(Uint8List.fromList(data));
    }
  }
  
  void _handleTextMessage(String payload) {
    try {
      final json = jsonDecode(payload);
      final type = json['type'] as String?;
      
      debugPrint('📩 Received: $type');
      
      switch (type) {
        case 'REGISTERED':
          debugPrint('✅ Device registered successfully');
          break;
          
        case 'TRANSFER_REQUEST':
          _handleTransferRequest(json);
          break;
          
        case 'TRANSFER_RESPONSE':
          _handleTransferResponse(json);
          break;
          
        case 'TRANSFER_FINISH':
          _handleTransferFinish(json);
          break;
          
        case 'ERROR':
          debugPrint('❌ Server error: ${json['message']}');
          break;
      }
    } catch (e) {
      debugPrint('❌ Error parsing message: $e');
    }
  }
  
  void _handleTransferRequest(Map<String, dynamic> request) {
    // Store for UI to show dialog
    _pendingRequest = request;
    notifyListeners();
    debugPrint('📥 Incoming transfer: ${request['fileName']}');
  }
  
  void _handleTransferResponse(Map<String, dynamic> response) {
    final status = response['status'];
    final transferId = response['transferId'] as String?;
    
    if (status == 'ACCEPTED') {
      debugPrint('✅ Transfer accepted! Starting binary upload for transfer: $transferId');
      
      // Check if this is for our pending transfer
      if (transferId == _currentTransferId && _pendingSendFile != null) {
        // Automatically start binary upload
        startBinaryUpload(_pendingSendFile!);
      } else {
        debugPrint('⚠️ ACCEPTED received but no pending file or transfer ID mismatch');
        // Still notify listeners so UI can handle if needed
        notifyListeners();
      }
    } else {
      debugPrint('❌ Transfer rejected: $transferId');
      _isSending = false;
      _currentTargetId = null;
      _currentTransferId = null;
      _pendingSendFile = null;
      notifyListeners();
    }
  }
  
  void _handleTransferFinish(Map<String, dynamic> json) {
    debugPrint('✅ Received TRANSFER_FINISH signal');
    if (_isReceiving && _fileSink != null) {
      _completeReceive();
    }
  }
  
  void _handleBinaryChunk(Uint8List chunk) {
    if (_fileSink == null) {
      debugPrint('⚠️ Received binary chunk but no file sink initialized');
      return;
    }
    
    try {
      _fileSink!.add(chunk);
      _receivedBytes += chunk.length;
      _progress = _totalBytes > 0 ? (_receivedBytes / _totalBytes).clamp(0.0, 1.0) : 0;
      notifyListeners();
      
      // Log progress every 100KB to avoid spam
      if (_receivedBytes % (100 * 1024) < chunk.length || _receivedBytes >= _totalBytes) {
        debugPrint('📦 Received ${(_receivedBytes / 1024).toStringAsFixed(1)}KB / ${(_totalBytes / 1024).toStringAsFixed(1)}KB (${(_progress * 100).toStringAsFixed(1)}%)');
      }
      
      // Don't auto-complete based on bytes - wait for FINISH signal
      // This prevents issues with incorrect file size calculations
    } catch (e) {
      debugPrint('❌ Error writing chunk: $e');
      _cleanupReceive();
    }
  }
  
  /// Accept an incoming transfer request
  Future<void> acceptTransfer() async {
    if (_pendingRequest == null) return;
    
    final request = _pendingRequest!;
    _pendingRequest = null;
    
    // Request storage permission - handle Android 13+ differently
    bool hasPermission = false;
    
    // Try manage external storage first (needed for Downloads folder on Android 11+)
    var manageStatus = await Permission.manageExternalStorage.status;
    if (manageStatus.isDenied) {
      manageStatus = await Permission.manageExternalStorage.request();
    }
    
    if (manageStatus.isGranted) {
      hasPermission = true;
    } else {
      // Fall back to regular storage permission (Android 12 and below)
      var storageStatus = await Permission.storage.status;
      if (storageStatus.isDenied) {
        storageStatus = await Permission.storage.request();
      }
      hasPermission = storageStatus.isGranted;
    }
    
    if (!hasPermission) {
      debugPrint('❌ Storage permission denied - rejecting transfer');
      // Send rejection back to sender so they don't hang
      _send({
        'type': 'TRANSFER_RESPONSE',
        'targetId': request['senderId'],
        'transferId': request['transferId'],
        'status': 'REJECTED',
      });
      notifyListeners();
      return;
    }
    
    // Prepare file for writing
    _currentTransferId = request['transferId'];
    _totalBytes = request['size'] as int? ?? 0;
    _receivedBytes = 0;
    _progress = 0.0;
    _isReceiving = true;
    
    // Get download directory
    Directory? directory;
    if (Platform.isAndroid) {
      directory = Directory('/storage/emulated/0/Download');
    } else {
      directory = await getApplicationDocumentsDirectory();
    }
    
    if (!directory.existsSync()) {
      directory = await getExternalStorageDirectory();
    }
    
    _receivingFile = File('${directory!.path}/${request['fileName']}');
    _fileSink = _receivingFile!.openWrite();
    
    debugPrint('📂 Saving to: ${_receivingFile!.path} (Expected size: ${(_totalBytes / 1024 / 1024).toStringAsFixed(2)}MB)');
    
    // Send acceptance response
    _send({
      'type': 'TRANSFER_RESPONSE',
      'targetId': request['senderId'],
      'transferId': _currentTransferId,
      'status': 'ACCEPTED',
    });
    
    notifyListeners();
  }
  
  /// Reject an incoming transfer request
  void rejectTransfer() {
    if (_pendingRequest == null) return;
    
    _send({
      'type': 'TRANSFER_RESPONSE',
      'targetId': _pendingRequest!['senderId'],
      'transferId': _pendingRequest!['transferId'],
      'status': 'REJECTED',
    });
    
    _pendingRequest = null;
    notifyListeners();
  }
  
  void _completeReceive() async {
    debugPrint('✅ Transfer complete! Finalizing file...');
    
    try {
      // Flush and close the file sink
      await _fileSink?.flush();
      await _fileSink?.close();
      
      if (_receivingFile != null && _receivingFile!.existsSync()) {
        final actualSize = await _receivingFile!.length();
        debugPrint('✅ File saved: ${_receivingFile!.path} (${(actualSize / 1024 / 1024).toStringAsFixed(2)}MB)');
        
        if (_totalBytes > 0 && actualSize != _totalBytes) {
          debugPrint('⚠️ Size mismatch: Expected ${_totalBytes} bytes, got $actualSize bytes');
        }
      }
    } catch (e) {
      debugPrint('❌ Error finalizing file: $e');
      // Clean up partial file on error
      try {
        if (_receivingFile != null && _receivingFile!.existsSync()) {
          await _receivingFile!.delete();
          debugPrint('🗑️ Deleted corrupted file');
        }
      } catch (deleteError) {
        debugPrint('❌ Error deleting corrupted file: $deleteError');
      }
    } finally {
      _fileSink = null;
      _receivingFile = null;
      _isReceiving = false;
      _progress = 1.0;
      _totalBytes = 0;
      _receivedBytes = 0;
      _currentTransferId = null;
      notifyListeners();
    }
  }
  
  void _cleanupReceive() async {
    debugPrint('🧹 Cleaning up receive state...');
    try {
      await _fileSink?.flush();
      await _fileSink?.close();
      
      // Delete partial/corrupted file
      if (_receivingFile != null && _receivingFile!.existsSync()) {
        await _receivingFile!.delete();
        debugPrint('🗑️ Deleted partial file');
      }
    } catch (e) {
      debugPrint('❌ Error during cleanup: $e');
    } finally {
      _fileSink = null;
      _receivingFile = null;
      _isReceiving = false;
      _totalBytes = 0;
      _receivedBytes = 0;
      _progress = 0.0;
      _currentTransferId = null;
      notifyListeners();
    }
  }
  
  /// Send a file to a target device
  Future<void> sendFile(String targetId, File file, String transferId) async {
    _isSending = true;
    _progress = 0.0;
    _currentTargetId = targetId;
    _currentTransferId = transferId;
    _pendingSendFile = file; // Store file reference for later upload
    notifyListeners();
    
    final fileSize = await file.length();
    
    // Send transfer request
    _send({
      'type': 'TRANSFER_REQUEST',
      'targetId': targetId,
      'senderId': _deviceId,
      'transferId': transferId,
      'fileName': file.path.split('/').last,
      'size': fileSize,
    });
    
    // Wait for ACCEPTED response before sending binary
    // The response will automatically trigger startBinaryUpload via _handleTransferResponse
    debugPrint('📤 Sent transfer request to $targetId for file ${file.path.split('/').last} (${(fileSize / 1024 / 1024).toStringAsFixed(2)}MB)');
  }
  
  /// Start binary upload (called after receiving ACCEPTED)
  Future<void> startBinaryUpload(File file) async {
    if (_channel == null || _currentTargetId == null) {
      debugPrint('❌ Cannot start upload: channel or target not set');
      return;
    }
    
    final fileSize = await file.length();
    int bytesSent = 0;
    
    debugPrint('🚀 Starting binary upload: ${file.path} (${(fileSize / 1024 / 1024).toStringAsFixed(2)}MB) in ${CHUNK_SIZE ~/ 1024}KB chunks');
    
    try {
      // Read file in 64KB chunks using openRead with explicit chunk size
      final stream = file.openRead();
      await for (final chunk in stream) {
        if (_channel == null || !_isConnected) {
          debugPrint('❌ Connection closed during upload');
          break;
        }
        
        // Ensure we're sending chunks of appropriate size
        // The default openRead() already chunks, but we ensure it's reasonable
        _channel!.sink.add(chunk);
        bytesSent += chunk.length;
        _progress = (bytesSent / fileSize).clamp(0.0, 1.0);
        
        // Update UI periodically (every ~10 chunks or at completion)
        if (bytesSent % (CHUNK_SIZE * 10) < chunk.length || bytesSent >= fileSize) {
          notifyListeners();
          debugPrint('📊 Upload progress: ${(_progress * 100).toStringAsFixed(1)}% (${(bytesSent / 1024 / 1024).toStringAsFixed(2)}MB / ${(fileSize / 1024 / 1024).toStringAsFixed(2)}MB)');
        }
        
        // Small delay to allow UI updates and prevent overwhelming the socket
        await Future.delayed(Duration.zero);
      }
      
      // Send FINISH signal after all binary data is sent
      debugPrint('✅ Binary upload complete! Sending FINISH signal...');
      _send({
        'type': 'TRANSFER_FINISH',
        'targetId': _currentTargetId,
        'transferId': _currentTransferId,
      });
      
      _isSending = false;
      _progress = 1.0;
      _currentTargetId = null;
      _currentTransferId = null;
      _pendingSendFile = null; // Clear pending file after completion
      notifyListeners();
      
      debugPrint('✅ Transfer completed successfully!');
    } catch (e) {
      debugPrint('❌ Upload error: $e');
      _isSending = false;
      _currentTargetId = null;
      _currentTransferId = null;
      _pendingSendFile = null; // Clear pending file on error
      notifyListeners();
    }
  }
  
  void _send(Map<String, dynamic> data) {
    if (_channel != null) {
      _channel!.sink.add(jsonEncode(data));
    }
  }
  
  void disconnect() {
    // Cleanup any ongoing transfers
    if (_isReceiving) {
      _cleanupReceive();
    }
    if (_isSending) {
      _isSending = false;
      _currentTargetId = null;
      _currentTransferId = null;
      _pendingSendFile = null;
    }
    
    _subscription?.cancel();
    _channel?.sink.close(status.normalClosure);
    _isConnected = false;
    notifyListeners();
  }
  
  @override
  void dispose() {
    disconnect();
    super.dispose();
  }
}
