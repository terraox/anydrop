import 'dart:io';
import 'dart:math';
import 'package:device_info_plus/device_info_plus.dart';

/// Utility class for device-related operations
class DeviceUtils {
  static final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();

  /// Generate a device name based on device info
  /// Example: "Aaditya's iPhone 15 Pro" or "Pixel 7"
  static Future<String> getDeviceName() async {
    try {
      if (Platform.isIOS) {
        final iosInfo = await _deviceInfo.iosInfo;
        return iosInfo.name;
      } else if (Platform.isAndroid) {
        final androidInfo = await _deviceInfo.androidInfo;
        return '${androidInfo.brand} ${androidInfo.model}';
      }
    } catch (e) {
      // Fallback to generated name
    }
    return generateCyberName();
  }

  /// Generate a cyber-themed device name
  /// Example: "Orbit-Alpha-42", "Nexus-Prime-7"
  static String generateCyberName() {
    final prefixes = ['Orbit', 'Nexus', 'Flux', 'Cyber', 'Titan', 'Aero', 'Prime', 'Nova'];
    final suffixes = ['Alpha', 'Beta', 'Prime', 'X', 'V2', 'Link', 'Node', 'Core'];
    
    final random = Random();
    final prefix = prefixes[random.nextInt(prefixes.length)];
    final suffix = suffixes[random.nextInt(suffixes.length)];
    final number = random.nextInt(100);
    
    return '$prefix-$suffix-$number';
  }

  /// Generate a unique device ID
  static String generateDeviceId() {
    final random = Random();
    return '#${random.nextInt(99) + 1}';
  }

  /// Get platform icon name
  static String getPlatformIcon() {
    if (Platform.isIOS) return 'smartphone';
    if (Platform.isAndroid) return 'smartphone';
    return 'monitor';
  }

  /// Check if running on mobile
  static bool get isMobile => Platform.isIOS || Platform.isAndroid;
}
