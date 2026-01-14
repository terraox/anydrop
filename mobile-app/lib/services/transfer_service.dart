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
import 'package:file_picker/file_picker.dart';
import 'package:open_file_plus/open_file_plus.dart';
import 'package:image_gallery_saver_plus/image_gallery_saver_plus.dart';
import 'package:http/http.dart' as http;
import '../models/device.dart';
import '../core/constants/api_constants.dart';
import '../utils/file_utils.dart';
import 'http_server_service.dart';
import 'package:shelf/shelf.dart' as shelf;
import 'package:mime/mime.dart';
import 'package:http_parser/http_parser.dart';

/// Unified Transfer Service for Handshake + Binary Streaming
class TransferService extends ChangeNotifier {
  final HttpServerService _httpServerService;
  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  
  TransferService(this._httpServerService) {
    _httpServerService.onFileTransfer = _handleHttpTransfer;
    _httpServerService.onWebSocketConnect = _handleIncomingWebSocket;
  }
  
  String? _deviceId;
  bool _isConnected = false;
  String? _connectedDeviceIp;
  int? _connectedDevicePort;
  Completer<bool>? _readyCompleter; // Completer to wait for READY message
  Completer<bool>? _acceptCompleter; // Completer to wait for ACCEPT message
  
  // Receiver state
  final Map<String, WebSocketChannel> _signalingChannels = {}; // transferId -> channel
  WebSocketChannel? _tempSignalingChannel; // Channel that just connected but hasn't sent metadata yet
  
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
  String? _pendingText; // Pending text message for UI
  
  // Save location preference
  String? _customSavePath;
  bool _saveToGallery = true; // Default: save images/videos to gallery
  
  // Constants
  static const int CHUNK_SIZE = 64 * 1024; // 64KB chunks
  
  // Setters for save preferences
  void setSaveLocation(String? path) {
    _customSavePath = path;
  }
  
  void setSaveToGallery(bool value) {
    _saveToGallery = value;
  }
  
  // Getters
  bool get isConnected => _isConnected;
  double get progress => _progress;
  bool get isReceiving => _isReceiving;
  bool get isSending => _isSending;
  Map<String, dynamic>? get pendingRequest => _pendingRequest;
  String? get pendingText => _pendingText;
  
  /// Connect to the unified transfer endpoint
  /// IMPORTANT: This method is deprecated for local file transfer.
  /// Use connectToReceiver() instead when sending files to a specific device.
  /// This method does NOT create WebSocket connections - receiver should never call this.
  @Deprecated('Use connectToReceiver() for device-to-device transfers')
  Future<void> connect(String deviceId) async {
    _deviceId = deviceId;
    
    // DISABLED - Do not create WebSocket connections here
    // For local file transfer, use connectToReceiver() when sending files
    // Receiver should never call this - receiver only hosts HTTP server
    debugPrint('⚠️ connect() disabled - use connectToReceiver() for device-to-device transfers');
    debugPrint('   Receiver should never call this - receiver only hosts HTTP server');
    _isConnected = false;
    notifyListeners();
  }
  
  /// Connect to receiver's WebSocket and wait for READY handshake
  /// This establishes the signaling channel before file transfer
  /// 
  /// IMPORTANT: This is the ONLY place where WebSocket connections are created
  /// - Creates exactly ONE WebSocket connection (disconnects existing first)
  /// - Uses receiver IP from mDNS discovery (never localhost)
  /// - Uses single path /ws (not /ws/transfer or /ws/stream)
  /// - No STOMP, plain WebSocket only (web_socket_channel package)
  /// - No auto-reconnect logic
  /// 
  /// [receiverIp] - Receiver's LAN IP from mDNS discovery (MUST be non-null, never localhost)
  /// [receiverPort] - Receiver's port (default 8080)
  /// Returns true if READY handshake received, false otherwise
  Future<bool> connectToReceiver(String receiverIp, int receiverPort) async {
    // GUARD: Prevent multiple simultaneous connections
    if (_channel != null && _isConnected) {
      debugPrint('⚠️ WebSocket already connected, reusing existing connection');
      return true;
    }
    
    try {
      // IMPORTANT: Close existing connection first to ensure exactly ONE WebSocket
      // This prevents multiple simultaneous connections
      await disconnect();
      
      // VALIDATE: Ensure IP is not localhost
      if (receiverIp == 'localhost' || receiverIp == '127.0.0.1') {
        debugPrint('❌ ERROR: Cannot use localhost for WebSocket connection');
        debugPrint('   Use discovered device IP from mDNS instead');
        return false;
      }
      
      // Connect to receiver's WebSocket using discovered IP (never localhost)
      // Use single path /ws (not /ws/transfer or /ws/stream)
      final wsUrl = 'ws://$receiverIp:$receiverPort/ws';
      debugPrint('🔌 Connecting to receiver WebSocket: $wsUrl');
      debugPrint('   ✅ Using discovered IP from mDNS (not localhost)');
      debugPrint('   ✅ Single WebSocket path: /ws');
      debugPrint('   ✅ Plain WebSocket (no STOMP)');
      debugPrint('   ✅ No auto-reconnect');
      
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      _connectedDeviceIp = receiverIp;
      _connectedDevicePort = receiverPort;
      
      // Create completer to wait for READY message
      _readyCompleter = Completer<bool>();
      
      // Listen for messages
      _subscription = _channel!.stream.listen(
        (message) {
          if (message is String) {
            _handleTextMessage(message);
          }
        },
        onError: (error) {
          debugPrint('❌ WebSocket error: $error');
          _isConnected = false;
          if (_readyCompleter != null && !_readyCompleter!.isCompleted) {
            _readyCompleter!.complete(false);
          }
          notifyListeners();
        },
        onDone: () {
          debugPrint('🔌 WebSocket closed');
          _isConnected = false;
          if (_readyCompleter != null && !_readyCompleter!.isCompleted) {
            _readyCompleter!.complete(false);
          }
          notifyListeners();
        },
      );
      
      // Wait for READY message (timeout after 5 seconds)
      final ready = await _readyCompleter!.future.timeout(
        const Duration(seconds: 5),
        onTimeout: () {
          debugPrint('❌ Timeout waiting for READY handshake');
          return false;
        },
      );
      
      if (ready) {
        debugPrint('✅ READY handshake received, connection established');
      }
      
      return ready;
    } catch (e) {
      debugPrint('❌ Failed to connect to receiver: $e');
      _isConnected = false;
      notifyListeners();
      return false;
    }
  }
  
  /// Disconnect from WebSocket
  /// Cleans up WebSocket connection and resets connection state
  Future<void> disconnect() async {
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
    
    // Close WebSocket connection
    if (_subscription != null) {
      await _subscription!.cancel();
      _subscription = null;
    }
    if (_channel != null) {
      await _channel!.sink.close(status.normalClosure);
      _channel = null;
    }
    
    // Reset connection state
    _isConnected = false;
    _connectedDeviceIp = null;
    _connectedDevicePort = null;
    _readyCompleter = null;
    notifyListeners();
  }
  
  void _handleMessage(dynamic data) {
    if (data is String) {
      // JSON Message (Handshake/Registration Only)
      _handleTextMessage(data);
    }
    // Binary chunks over WebSocket are no longer used for transfers
  }
  
  void _handleTextMessage(String payload) {
    try {
      final json = jsonDecode(payload);
      final type = json['type'] as String?;
      
      debugPrint('📩 Received: $type');
      
      switch (type) {
        case 'READY':
          debugPrint('📥 Handshake READY received');
          _handleReadyMessage(json);
          break;
          
        case 'REGISTERED':
          debugPrint('✅ Device registered successfully');
          break;
          
        case 'ACCEPT':
          debugPrint('📥 Acceptance signal received');
          _handleAcceptMessage(json);
          break;
          
        case 'REJECT':
          debugPrint('📥 Rejection signal received');
          _handleRejectMessage(json);
          break;
          
        case 'TRANSFER_REQUEST':
          debugPrint('📥 Legacy transfer request received');
          _handleTransferRequest(json);
          break;
          
        case 'TRANSFER_RESPONSE':
          debugPrint('📥 Transfer response received');
          _handleTransferResponse(json);
          break;
          
        case 'TRANSFER_FINISH':
          debugPrint('📥 Transfer finish received');
          _handleTransferFinish(json);
          break;
          
        case 'FILE_METADATA':
          if (json['senderId'] == _deviceId) {
            debugPrint('🔄 Ignoring self-sent file metadata');
            break;
          }
          debugPrint('📥 File metadata received via local WS');
          _handleFileMetadata(json);
          break;
          
        case 'ERROR':
          debugPrint('❌ Server error: ${json['message']}');
          break;

        case 'TEXT_MESSAGE':
          if (json['senderId'] == _deviceId) {
            debugPrint('🔄 Ignoring self-sent text message');
            break;
          }
          debugPrint('📝 Text message received');
          _pendingText = json['text'];
          notifyListeners();
          break;
          
        default:
          debugPrint('❓ Unknown message type: $type');
      }
    } catch (e) {
      debugPrint('❌ Error parsing message: $e');
    }
  }
  
  /// Handle READY message from receiver
  void _handleReadyMessage(Map<String, dynamic> json) {
    final role = json['role'] as String?;
    debugPrint('✅ READY handshake received from receiver (role: $role)');
    _isConnected = true;
    notifyListeners();
    
    // Complete the ready completer if waiting
    if (_readyCompleter != null && !_readyCompleter!.isCompleted) {
      _readyCompleter!.complete(true);
    }
  }
  
  /// Handle ACCEPT message from receiver
  void _handleAcceptMessage(Map<String, dynamic> json) {
    final transferId = json['transferId'] as String?;
    debugPrint('🔔 ACCEPT MESSAGE RECEIVED!');
    debugPrint('   -> Received transferId: $transferId');
    debugPrint('   -> Current transferId: $_currentTransferId');
    debugPrint('   -> Pending file: ${_pendingSendFile?.path}');
    debugPrint('   -> Target IP: $_targetIp:$_targetPort');
    
    // Complete the accept completer if waiting
    if (_acceptCompleter != null && !_acceptCompleter!.isCompleted) {
      _acceptCompleter!.complete(true);
    }
    
    // If we have a pending file, start the upload
    if (_pendingSendFile != null) {
      debugPrint('✅ ACCEPT received - starting HTTP upload NOW!');
      startBinaryUpload(_pendingSendFile!);
    } else {
      debugPrint('❌ No pending file to upload!');
    }
  }

  /// Handle incoming WebSocket signaling connection (receiver UI case)
  void _handleIncomingWebSocket(WebSocketChannel webSocket, String clientIp) {
    debugPrint('🔌 Incoming signaling connection from $clientIp');
    
    // Store as temporary channel until we get metadata with a transferId
    _tempSignalingChannel = webSocket;

    // Immediately send READY handshake to the sender
    final readyMsg = jsonEncode({
      'type': 'READY',
      'role': 'receiver'
    });
    webSocket.sink.add(readyMsg);
    debugPrint('✅ Sent READY handshake to $clientIp');

    // Store this channel as an active signaling channel
    // Note: We might have multiple if multiple senders connect
    // For now, let's just listen to it
    webSocket.stream.listen(
      (message) {
        if (message is String) {
          debugPrint('📨 [Internal WS] Received: $message');
          _handleTextMessage(message);
          
          // If we need to send responses back to THIS specific sender
          // We can handle that in _handleTextMessage or by wrapping the logic
        }
      },
      onError: (err) => debugPrint('❌ [Internal WS] Error: $err'),
      onDone: () {
        debugPrint('🔌 [Internal WS] Disconnected');
        // Cleanup if needed
        _signalingChannels.removeWhere((key, value) => value == webSocket);
        if (_tempSignalingChannel == webSocket) _tempSignalingChannel = null;
      },
    );
  }

  /// Handle FILE_METADATA from sender (laptop)
  void _handleFileMetadata(Map<String, dynamic> json) {
    final transferId = json['transferId'] as String?;
    if (transferId == null) return;

    debugPrint('📋 Received FILE_METADATA for $transferId');

    // If we have a temporary channel, associate it with this transferId
    if (_tempSignalingChannel != null) {
      _signalingChannels[transferId] = _tempSignalingChannel!;
      _tempSignalingChannel = null; // No longer temporary
    }

    // Convert FILE_METADATA to TRANSFER_REQUEST format for internal consistency
    final files = json['files'] as List?;
    final firstFile = files != null && files.isNotEmpty ? files[0] : null;
    
    final request = {
      'type': 'TRANSFER_REQUEST',
      'transferId': transferId,
      'fileName': firstFile?['name'] ?? 'unknown',
      'size': firstFile?['size'] ?? 0,
      'senderId': json['senderId'] ?? 'unknown',
      'mimeType': firstFile?['type'] ?? 'application/octet-stream',
    };

    _handleTransferRequest(request);
  }
  
  /// Handle REJECT message from receiver
  void _handleRejectMessage(Map<String, dynamic> json) {
    final transferId = json['transferId'] as String?;
    debugPrint('❌ Receiver rejected transfer: $transferId');
    
    // Complete the accept completer with false (rejected)
    if (_acceptCompleter != null && !_acceptCompleter!.isCompleted) {
      _acceptCompleter!.complete(false);
    }
    
    _isSending = false;
    _currentTargetId = null;
    _currentTransferId = null;
    _pendingSendFile = null;
    notifyListeners();
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
    
    if (status == 'ACCEPTED' || status == 'READY') {
      debugPrint('✅ Transfer ready! Starting binary upload for transfer: $transferId');
      
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

  void clearPendingText() {
    _pendingText = null;
    notifyListeners();
  }
  
  /// Send text message to receiver
  Future<void> sendText(Device device, String text) async {
    try {
        if (device.ip == null) {
            throw Exception('Device IP is missing');
        }
        final connected = await connectToReceiver(device.ip!, device.port ?? 8080);
        if (!connected) throw Exception('Failed to connect');

        _channel!.sink.add(jsonEncode({
           'type': 'TEXT_MESSAGE',
           'text': text,
           'senderId': _deviceId ?? 'mobile-app', 
           'timestamp': DateTime.now().millisecondsSinceEpoch
        }));
        
        // Short delay to ensure sent before closing? 
        // Or keep open? connectToReceiver opens a channel.
        // We can keep it open or close it. 
        // For now, let it handle itself.
        
    } catch (e) {
        debugPrint('❌ Failed to send text: $e');
        rethrow;
    }
  }

  void _handleTransferFinish(Map<String, dynamic> json) {
    debugPrint('✅ Received TRANSFER_FINISH signal');
    if (_isReceiving && _fileSink != null) {
      _completeReceive();
    }
  }
  
  Future<shelf.Response> _handleHttpTransfer(shelf.Request request) async {
    try {
      // IMPORTANT: Receiver validates pairing code from headers
      // Sender must include X-Device-Id, X-Pairing-Code, and X-Sender-Device-Id headers
      final deviceId = request.headers['x-device-id'];
      final pairingCode = request.headers['x-pairing-code'];
      final senderDeviceId = request.headers['x-sender-device-id'];
      // Normalize headers: some clients might send camelCase, others lowercase
      final transferId = request.headers['x-transfer-id'] ?? request.url.queryParameters['transferId'];
      var fileNameHeader = request.headers['x-file-name'];
      
      // FALLBACK: If header is missing, try to find filename from the pending request metadata
      if ((fileNameHeader == null || fileNameHeader == 'received_file') && transferId != null) {
        if (_pendingRequest != null && _pendingRequest!['transferId'] == transferId) {
             fileNameHeader = _pendingRequest!['fileName'];
             debugPrint('📎 Recovered filename from metadata: $fileNameHeader');
        }
      }

      if (deviceId == null || pairingCode == null) {
        debugPrint('⚠️ Missing pairing code headers - accepting anyway (validation not implemented)');
        // In production, validate pairing code here
      } else {
        debugPrint('🔐 Received file transfer with pairing code from $senderDeviceId');
      }
      
      final contentType = request.headers['content-type'];
      if (contentType == null) return shelf.Response.badRequest(body: 'Missing content-type');
      
      final contentLength = int.tryParse(request.headers['content-length'] ?? '0') ?? 0;
      
      // If we already have _totalBytes from FILE_METADATA, don't overwrite if contentLength is 0
      if (_totalBytes <= 0 || contentLength > 0) {
        _totalBytes = contentLength;
      }
      
      debugPrint('📥 HTTP Upload: $fileNameHeader, Size: $_totalBytes bytes (Headers: $contentLength)');
      
      _receivedBytes = 0;
      _progress = 0.0;
      _isReceiving = true;
      notifyListeners();

      // Check content type
      if (contentType.contains('multipart/form-data')) {
        debugPrint('📦 Handling multipart/form-data');
        // ... (Multipart logic omitted for brevity, assuming raw stream for now as Laptop uses that)
        return shelf.Response.badRequest(body: 'Multipart not supported yet for local transfer');
      } 
      
      // Default to assuming raw stream if not multipart (or explicit octet-stream)
      debugPrint('🚀 Handling raw stream upload (Content-Type: $contentType)');
      final fileName = fileNameHeader ?? 'received_file';
      
      final directory = await getDownloadDirectory();
      final sanitizedName = FileUtils.sanitizeFileName(fileName);
      _receivingFile = File('${directory.path}/$sanitizedName');
      _fileSink = _receivingFile!.openWrite();

      int bytesReceivedTotal = 0;
      debugPrint('⏳ Streaming bytes directly to file: ${_receivingFile!.path}');
      
      try {
        await for (final List<int> chunk in request.read()) {
          _fileSink!.add(chunk);
          bytesReceivedTotal += chunk.length;
          _receivedBytes = bytesReceivedTotal;
          
          if (_totalBytes > 0) {
            _progress = bytesReceivedTotal / _totalBytes;
            // Send progress update via signaling channel (throttle this slightly in prod)
            final channel = _signalingChannels[transferId];
            if (channel != null) {
              channel.sink.add(jsonEncode({
                'type': 'PROGRESS',
                'transferId': transferId,
                'percentage': (_progress * 100).toStringAsFixed(1),
              }));
            }
          } else {
             // If total bytes unknown, assuming 0 progress or handle differently
             if (bytesReceivedTotal % (1024 * 1024) == 0) debugPrint('📥 Received ${bytesReceivedTotal / 1024 / 1024} MB...');
          }
          notifyListeners();
        }
      } catch (streamError) {
        debugPrint('❌ Stream handling error: $streamError');
        throw streamError;
      }
      
      debugPrint('🏁 Stream finished. Received $bytesReceivedTotal bytes.');

      await _completeReceive();
      return shelf.Response.ok(jsonEncode({
        'status': 'success',
        'transferId': transferId,
        'file': fileName
      }));

    } catch (e) {
      debugPrint('❌ HTTP Transfer Error: $e');
      _cleanupReceive();
      return shelf.Response.internalServerError(body: e.toString());
    }
  }

  Future<Directory> getDownloadDirectory() async {
    if (Platform.isAndroid) {
      return Directory('/storage/emulated/0/Download/AnyDrop');
    } else {
      return await getApplicationDocumentsDirectory();
    }
  }
  
  /// Choose save location for incoming file
  Future<String?> chooseSaveLocation(String fileName) async {
    try {
      // Use file_picker to let user choose directory
      String? selectedDirectory = await FilePicker.platform.getDirectoryPath();
      return selectedDirectory;
    } catch (e) {
      debugPrint('❌ Error choosing save location: $e');
      return null;
    }
  }
  
  /// Accept an incoming transfer request
  /// [savePath] - Optional custom save path. If null, uses default location based on file type
  Future<void> acceptTransfer({String? savePath}) async {
    if (_pendingRequest == null) return;
    
    final request = _pendingRequest!;
    _pendingRequest = null;
    
    // Use provided save path or custom path if set
    if (savePath != null) {
      _customSavePath = savePath;
    }
    
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
    
    // Sanitize filename
    final fileName = FileUtils.sanitizeFileName(request['fileName'] as String);
    final isMediaFile = FileUtils.isMedia(fileName);
    
    // Get appropriate save directory
    Directory? directory;
    
    // Use custom path if set, otherwise use appropriate directory based on file type
    if (_customSavePath != null) {
      directory = Directory(_customSavePath!);
    } else if (Platform.isAndroid) {
      // For Android, use appropriate directory based on file type
      if (isMediaFile && _saveToGallery) {
        // Save to gallery-accessible location
        if (FileUtils.isImage(fileName)) {
          directory = Directory('/storage/emulated/0/Pictures/AnyDrop');
        } else if (FileUtils.isVideo(fileName)) {
          directory = Directory('/storage/emulated/0/Movies/AnyDrop');
        } else if (FileUtils.isAudio(fileName)) {
          directory = Directory('/storage/emulated/0/Music/AnyDrop');
        } else {
          directory = Directory('/storage/emulated/0/Download/AnyDrop');
        }
      } else {
        directory = Directory('/storage/emulated/0/Download/AnyDrop');
      }
    } else {
      // iOS - use documents directory
      directory = await getApplicationDocumentsDirectory();
    }
    
    // Ensure directory exists
    if (!directory.existsSync()) {
      await directory.create(recursive: true);
    }
    
    _receivingFile = File('${directory.path}/$fileName');
    _fileSink = _receivingFile!.openWrite();
    
    debugPrint('📂 Saving to: ${_receivingFile!.path} (Expected size: ${(_totalBytes / 1024 / 1024).toStringAsFixed(2)}MB, Type: ${FileUtils.getMimeType(fileName)})');
    
    // Send acceptance response
    final transferId = _currentTransferId;
    final channel = _signalingChannels[transferId];
    
    if (channel != null) {
      debugPrint('📨 Sending ACCEPT via direct WebSocket channel for $transferId');
      channel.sink.add(jsonEncode({
        'type': 'ACCEPT',
        'transferId': transferId,
      }));
    } else {
      debugPrint('📨 Sending TRANSFER_RESPONSE via fallback channel');
      _send({
        'type': 'TRANSFER_RESPONSE',
        'targetId': request['senderId'],
        'transferId': transferId,
        'status': 'ACCEPTED',
      });
    }
    
    notifyListeners();
  }
  
  /// Reject an incoming transfer request
  void rejectTransfer() {
    if (_pendingRequest == null) return;
    
    final transferId = _pendingRequest!['transferId'];
    final channel = _signalingChannels[transferId];

    if (channel != null) {
      debugPrint('📨 Sending REJECT via direct WebSocket channel for $transferId');
      channel.sink.add(jsonEncode({
        'type': 'REJECT',
        'transferId': transferId,
      }));
    } else {
      _send({
        'type': 'TRANSFER_RESPONSE',
        'targetId': _pendingRequest!['senderId'],
        'transferId': transferId,
        'status': 'REJECTED',
      });
    }
    
    _pendingRequest = null;
    notifyListeners();
  }
  
  Future<void> _completeReceive() async {
    debugPrint('✅ Transfer complete! Finalizing file...');
    
    try {
      // Flush and close the file sink
      await _fileSink?.flush();
      await _fileSink?.close();
      
      if (_receivingFile != null && _receivingFile!.existsSync()) {
        final actualSize = await _receivingFile!.length();
        final fileName = _receivingFile!.path.split('/').last;
        debugPrint('✅ File saved: ${_receivingFile!.path}');
        debugPrint('📊 Final report: Expected $_totalBytes, Received $_receivedBytes, Actual $actualSize bytes');
        
        if (_totalBytes > 0 && actualSize != _totalBytes) {
          debugPrint('🚨 CRITICAL SIZE MISMATCH: Expected $_totalBytes, got $actualSize');
        } else {
          debugPrint('✨ Exact byte match confirmed!');
        }
        
        // For Android: Add to MediaStore if it's an image or video and saveToGallery is enabled
        if (Platform.isAndroid && _saveToGallery) {
          try {
            final bytes = await _receivingFile!.readAsBytes();
            
            if (FileUtils.isImage(fileName)) {
              // Save image to gallery
              final result = await ImageGallerySaverPlus.saveImage(
                bytes,
                name: fileName,
                isReturnImagePathOfIOS: false,
              );
              
              if (result['isSuccess'] == true) {
                debugPrint('✅ Image added to gallery: ${result['filePath']}');
              } else {
                debugPrint('⚠️ Failed to add image to gallery, but file is saved at: ${_receivingFile!.path}');
              }
            } else if (FileUtils.isVideo(fileName)) {
              // Save video to gallery
              final result = await ImageGallerySaverPlus.saveFile(
                _receivingFile!.path,
                name: fileName,
              );
              
              if (result['isSuccess'] == true) {
                debugPrint('✅ Video added to gallery: ${result['filePath']}');
              } else {
                debugPrint('⚠️ Failed to add video to gallery, but file is saved at: ${_receivingFile!.path}');
              }
            }
          } catch (e) {
            debugPrint('⚠️ Error adding to gallery: $e (file is still saved at: ${_receivingFile!.path})');
          }
        } else {
          // File is saved but not added to gallery (either not Android, or saveToGallery is false)
          debugPrint('📂 File saved to: ${_receivingFile!.path} (not added to gallery)');
        }
        
        // Try to open the file (optional - can be disabled)
        // Uncomment if you want files to auto-open after transfer
        // try {
        //   await OpenFile.open(_receivingFile!.path);
        // } catch (e) {
        //   debugPrint('Could not open file: $e');
        // }
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
      _customSavePath = null; // Reset custom path after transfer
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
  /// Establishes WebSocket connection, waits for READY, sends file metadata, then uploads via HTTP
  Future<void> sendFile(Device targetDevice, File file, String transferId) async {
    _isSending = true;
    _progress = 0.0;
    _currentTargetId = targetDevice.id;
    _currentTransferId = transferId;
    _pendingSendFile = file; // Store file reference for later upload
    notifyListeners();
    
    final fileSize = await file.length();
    final fileName = file.path.split('/').last;
    final mimeType = FileUtils.getMimeType(fileName);
    
    // Check if we have an IP for direct transfer
    final targetIp = targetDevice.ip;
    final targetPort = targetDevice.port ?? 8080;
    
    // Validate target IP is available
    if (targetIp == null) {
      debugPrint('❌ Cannot send file: target device IP not available. Device must be discovered via mDNS first.');
      _isSending = false;
      notifyListeners();
      return;
    }
    
    // Store target info for the actual upload
    _targetIp = targetIp;
    _targetPort = targetPort;
    
    debugPrint('📤 Preparing to send file to ${targetDevice.name}: $fileName (${(fileSize / 1024 / 1024).toStringAsFixed(2)}MB)');
    
    // Step 1: Connect to receiver's WebSocket and wait for READY handshake
    debugPrint('🔌 Step 1: Connecting to receiver WebSocket...');
    final connected = await connectToReceiver(targetIp, targetPort);
    
    if (!connected) {
      debugPrint('❌ Failed to establish WebSocket connection or receive READY handshake');
      _isSending = false;
      notifyListeners();
      return;
    }
    
    // Step 2: Send file metadata via WebSocket (signaling)
    debugPrint('📋 Step 2: Sending file metadata...');
    if (_channel != null) {
      _channel!.sink.add(jsonEncode({
        'type': 'FILE_METADATA',
        'transferId': transferId,
        'fileName': fileName,
        'size': fileSize,
        'mimeType': mimeType,
        'senderId': _deviceId,
      }));
      debugPrint('✅ File metadata sent, waiting for receiver response...');
    } else {
      debugPrint('❌ WebSocket channel not available');
      _isSending = false;
      notifyListeners();
      return;
    }
    
    // Step 3: Wait for ACCEPT message using Completer
    debugPrint('⏳ Waiting for receiver to accept transfer...');
    _acceptCompleter = Completer<bool>();
    
    // Wait for ACCEPT with 60 second timeout
    try {
      final accepted = await _acceptCompleter!.future.timeout(
        const Duration(seconds: 60),
        onTimeout: () {
          debugPrint('❌ Timeout waiting for ACCEPT');
          return false;
        },
      );
      
      if (!accepted) {
        debugPrint('❌ Transfer was rejected or timed out');
        _isSending = false;
        _currentTransferId = null;
        _pendingSendFile = null;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('❌ Error waiting for ACCEPT: $e');
      _isSending = false;
      notifyListeners();
    } finally {
      _acceptCompleter = null;
    }
  }

  String? _targetIp;
  int? _targetPort;

  /// Start binary upload using HTTP Streaming (RAW BINARY)
  /// 
  /// ❌ Do NOT use MultipartRequest
  /// ❌ Do NOT use multipart/form-data  
  /// ✅ Use application/octet-stream
  /// ✅ Stream file bytes directly in request body
  Future<void> startBinaryUpload(File file) async {
    if (_currentTargetId == null) {
      debugPrint('❌ Cannot start upload: target not set');
      return;
    }

    final fileSize = await file.length();
    final fileName = file.path.split('/').last;
    
    // IMPORTANT: Always use discovered device IP from mDNS, never localhost
    if (_targetIp == null) {
      debugPrint('❌ Cannot upload: target device IP not available. Device must be discovered via mDNS first.');
      _isSending = false;
      notifyListeners();
      return;
    }
    
    // Use discovered device IP and port (from mDNS)
    // Include transferId in query param for backend
    final uploadUrl = 'http://$_targetIp:$_targetPort/upload?transferId=${_currentTransferId ?? ''}';
    
    debugPrint('🚀 Starting RAW HTTP Stream upload to $_targetIp:$_targetPort');
    debugPrint('   File: ${file.path} (${(fileSize / 1024 / 1024).toStringAsFixed(2)}MB)');
    debugPrint('   Content-Type: application/octet-stream');
    
    try {
      // Create HTTP client for streaming upload
      final httpClient = HttpClient();
      final request = await httpClient.postUrl(Uri.parse(uploadUrl));
      
      // 🚨 MANDATORY: Set headers for raw binary streaming
      request.headers.set('X-File-Name', fileName);
      request.headers.set('Content-Type', 'application/octet-stream');
      request.headers.set('Content-Length', fileSize.toString());
      request.headers.set('X-Transfer-Id', _currentTransferId ?? '');
      request.headers.set('X-Sender-Device-Id', _deviceId ?? 'flutter-app');
      
      // Stream file bytes directly to request body
      int bytesSent = 0;
      final fileStream = file.openRead();
      
      // Transform stream to track progress
      final progressStream = fileStream.map((chunk) {
        bytesSent += chunk.length;
        _progress = (bytesSent / fileSize).clamp(0.0, 1.0);
        
        // Throttled UI update (every ~5%)
        if (bytesSent % (fileSize ~/ 20 + 1) < chunk.length || bytesSent >= fileSize) {
          notifyListeners();
          debugPrint('📊 UPLOAD PROGRESS: ${(_progress * 100).toStringAsFixed(1)}%');
        }
        
        return chunk;
      });
      
      // 🚨 MANDATORY: Add file stream directly to request (NOT FormData)
      await request.addStream(progressStream);
      
      // Send the request and get response
      final response = await request.close();
      
      // Read response body
      final responseBody = await response.transform(utf8.decoder).join();
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        debugPrint('✅ UPLOAD COMPLETE! Response: $responseBody');
        
        // Notify the target via WebSocket that we're finished (optional)
        _send({
          'type': 'TRANSFER_FINISH',
          'targetId': _currentTargetId,
          'transferId': _currentTransferId,
        });
      } else {
        debugPrint('❌ UPLOAD FAILED: ${response.statusCode} - $responseBody');
      }
      
      httpClient.close();
      
      _isSending = false;
      _progress = 1.0;
      _currentTargetId = null;
      _currentTransferId = null;
      _pendingSendFile = null;
      notifyListeners();
      
    } catch (e) {
      debugPrint('❌ Upload error: $e');
      _isSending = false;
      _currentTargetId = null;
      _currentTransferId = null;
      _pendingSendFile = null;
      notifyListeners();
    }
  }
  
  void _send(Map<String, dynamic> data) {
    if (_channel != null) {
      _channel!.sink.add(jsonEncode(data));
    }
  }
  
  
  @override
  void dispose() {
    disconnect();
    super.dispose();
  }
}
