/// File transfer status
enum TransferStatus { pending, uploading, downloading, completed, failed, cancelled }

/// File transfer model
class FileTransfer {
  final String id;
  final String name;
  final String type;
  final int sizeBytes;
  final TransferStatus status;
  final double progress; // 0.0 to 1.0
  final String? targetDeviceId;
  final String? sourceDeviceId;
  final DateTime createdAt;
  final String? errorMessage;

  FileTransfer({
    required this.id,
    required this.name,
    required this.type,
    required this.sizeBytes,
    this.status = TransferStatus.pending,
    this.progress = 0.0,
    this.targetDeviceId,
    this.sourceDeviceId,
    DateTime? createdAt,
    this.errorMessage,
  }) : createdAt = createdAt ?? DateTime.now();

  factory FileTransfer.fromJson(Map<String, dynamic> json) {
    return FileTransfer(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Unknown',
      type: json['type'] ?? 'file',
      sizeBytes: json['sizeBytes'] ?? 0,
      status: _parseStatus(json['status']),
      progress: (json['progress'] ?? 0.0).toDouble(),
      targetDeviceId: json['targetDeviceId'],
      sourceDeviceId: json['sourceDeviceId'],
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      errorMessage: json['errorMessage'],
    );
  }

  static TransferStatus _parseStatus(String? status) {
    switch (status) {
      case 'pending':
        return TransferStatus.pending;
      case 'uploading':
        return TransferStatus.uploading;
      case 'downloading':
        return TransferStatus.downloading;
      case 'completed':
        return TransferStatus.completed;
      case 'failed':
        return TransferStatus.failed;
      case 'cancelled':
        return TransferStatus.cancelled;
      default:
        return TransferStatus.pending;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'sizeBytes': sizeBytes,
      'status': status.name,
      'progress': progress,
      'targetDeviceId': targetDeviceId,
      'sourceDeviceId': sourceDeviceId,
      'createdAt': createdAt.toIso8601String(),
      'errorMessage': errorMessage,
    };
  }

  FileTransfer copyWith({
    String? id,
    String? name,
    String? type,
    int? sizeBytes,
    TransferStatus? status,
    double? progress,
    String? targetDeviceId,
    String? sourceDeviceId,
    DateTime? createdAt,
    String? errorMessage,
  }) {
    return FileTransfer(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      sizeBytes: sizeBytes ?? this.sizeBytes,
      status: status ?? this.status,
      progress: progress ?? this.progress,
      targetDeviceId: targetDeviceId ?? this.targetDeviceId,
      sourceDeviceId: sourceDeviceId ?? this.sourceDeviceId,
      createdAt: createdAt ?? this.createdAt,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  /// Human-readable file size
  String get formattedSize {
    if (sizeBytes < 1024) return '$sizeBytes B';
    if (sizeBytes < 1024 * 1024) return '${(sizeBytes / 1024).toStringAsFixed(1)} KB';
    if (sizeBytes < 1024 * 1024 * 1024) return '${(sizeBytes / (1024 * 1024)).toStringAsFixed(2)} MB';
    return '${(sizeBytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }

  /// Progress as percentage
  int get progressPercent => (progress * 100).round();

  bool get isActive => status == TransferStatus.uploading || status == TransferStatus.downloading;
  bool get isDone => status == TransferStatus.completed;
  bool get hasFailed => status == TransferStatus.failed;
}
