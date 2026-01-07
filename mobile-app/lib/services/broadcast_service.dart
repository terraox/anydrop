import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:nsd/nsd.dart';

/// Service for broadcasting this device on the local network via mDNS
/// Allows other AnyDrop devices to discover this phone/tablet
class BroadcastService {
  Registration? _registration;
  bool _isBroadcasting = false;

  static const String serviceType = '_anydrop._tcp';
  static const int servicePort = 8080;

  bool get isBroadcasting => _isBroadcasting;

  /// Start broadcasting this device on the network
  Future<void> startBroadcasting({
    required String name,
    required String iconType,
  }) async {
    // Stop any existing broadcast first
    await stopBroadcasting();

    try {
      // Register the mDNS service
      _registration = await register(Service(
        name: name,
        type: serviceType,
        port: servicePort,
        txt: {
          'name': Uint8List.fromList(utf8.encode(name)),
          'icon': Uint8List.fromList(utf8.encode(iconType)),
          'type': Uint8List.fromList(utf8.encode('PHONE')),
          'platform': Uint8List.fromList(utf8.encode(Platform.isAndroid ? 'android' : 'ios')),
          'version': Uint8List.fromList(utf8.encode('1.0.0')),
        },
      ));

      _isBroadcasting = true;
      debugPrint('📡 mDNS Broadcast started: $name ($iconType)');
    } catch (e) {
      debugPrint('❌ Failed to start broadcast: $e');
      _isBroadcasting = false;
    }
  }

  /// Stop broadcasting this device
  Future<void> stopBroadcasting() async {
    if (_registration != null) {
      try {
        await unregister(_registration!);
      } catch (e) {
        debugPrint('Error unregistering: $e');
      }
      _registration = null;
      _isBroadcasting = false;
    }
  }

  /// Update the broadcast with new device info
  Future<void> updateBroadcast({
    required String name,
    required String iconType,
  }) async {
    await startBroadcasting(name: name, iconType: iconType);
  }
}
