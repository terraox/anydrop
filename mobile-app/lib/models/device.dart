/// Device connection status
enum DeviceStatus { online, offline, busy, receiving }

/// Nearby device model
class Device {
  final String id; // sessionId
  final String name;
  final String model;
  final String type; // 'phone', 'tablet', 'laptop', 'desktop'
  final DeviceStatus status;
  final int batteryLevel;
  final String? deviceIcon; // e.g., 'mobile', 'laptop' which maps to an Icon
  final String? ip;
  final int? port;
  final DateTime lastSeen;

  Device({
    required this.id,
    required this.name,
    required this.model,
    required this.type,
    this.status = DeviceStatus.online,
    this.batteryLevel = 100,
    this.deviceIcon,
    this.ip,
    this.port,
    DateTime? lastSeen,
  }) : lastSeen = lastSeen ?? DateTime.now();

  factory Device.fromJson(Map<String, dynamic> json) {
    return Device(
      id: json['sessionId'] ?? '',
      name: json['name'] ?? 'Unknown Device',
      model: json['model'] ?? 'Unknown Model',
      type: json['type'] ?? 'PHONE',
      status: DeviceStatus.online, // Default to online if we receive it
      batteryLevel: json['batteryLevel'] ?? 100,
      deviceIcon: json['deviceIcon'],
      ip: json['ip'],
      port: json['port'],
      lastSeen: DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'sessionId': id,
      'name': name,
      'model': model,
      'type': type,
      'batteryLevel': batteryLevel,
      'deviceIcon': deviceIcon,
      'ip': ip,
      'port': port,
    };
  }

  bool get isOnline => status == DeviceStatus.online;

  String get statusText {
    switch (status) {
      case DeviceStatus.online:
        return 'Online';
      case DeviceStatus.busy:
        return 'Busy';
      case DeviceStatus.receiving:
        return 'Receiving';
      case DeviceStatus.offline:
      default:
        return 'Offline';
    }
  }
}
