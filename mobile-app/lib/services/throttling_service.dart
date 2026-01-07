import '../models/user.dart';

/// Throttling service for plan-based speed limits
/// Mirrors the Spring Boot backend logic
class ThrottlingService {
  // Speed limits in bytes per second
  static const int _scoutSpeedLimit = 1024 * 1024; // 1 MB/s
  static const int _titanSpeedLimit = 10 * 1024 * 1024; // 10 MB/s

  // File size limits
  static const int _scoutFileSizeLimit = 100 * 1024 * 1024; // 100 MB
  static const int _titanFileSizeLimit = 2 * 1024 * 1024 * 1024; // 2 GB (using ~2GB for int)

  // Daily transfer limits
  static const int _scoutDailyLimit = 500 * 1024 * 1024; // 500 MB
  static const int _titanDailyLimit = -1; // Unlimited

  /// Get upload speed limit based on user plan
  int getSpeedLimit(UserPlan plan) {
    return plan == UserPlan.titan ? _titanSpeedLimit : _scoutSpeedLimit;
  }

  /// Get maximum file size allowed
  int getMaxFileSize(UserPlan plan) {
    return plan == UserPlan.titan ? _titanFileSizeLimit : _scoutFileSizeLimit;
  }

  /// Get daily transfer limit (-1 for unlimited)
  int getDailyLimit(UserPlan plan) {
    return plan == UserPlan.titan ? _titanDailyLimit : _scoutDailyLimit;
  }

  /// Check if file size is within limits
  bool isFileSizeAllowed(int fileSizeBytes, UserPlan plan) {
    return fileSizeBytes <= getMaxFileSize(plan);
  }

  /// Get speed limit as human-readable string
  String getSpeedLimitText(UserPlan plan) {
    final limit = getSpeedLimit(plan);
    if (limit >= 1024 * 1024) {
      return '${(limit / (1024 * 1024)).toStringAsFixed(0)} MB/s';
    }
    return '${(limit / 1024).toStringAsFixed(0)} KB/s';
  }

  /// Get file size limit as human-readable string
  String getFileSizeLimitText(UserPlan plan) {
    final limit = getMaxFileSize(plan);
    if (limit >= 1024 * 1024 * 1024) {
      return '${(limit / (1024 * 1024 * 1024)).toStringAsFixed(0)} GB';
    }
    return '${(limit / (1024 * 1024)).toStringAsFixed(0)} MB';
  }

  /// Get daily limit as human-readable string
  String getDailyLimitText(UserPlan plan) {
    final limit = getDailyLimit(plan);
    if (limit < 0) return 'Unlimited';
    if (limit >= 1024 * 1024 * 1024) {
      return '${(limit / (1024 * 1024 * 1024)).toStringAsFixed(0)} GB/day';
    }
    return '${(limit / (1024 * 1024)).toStringAsFixed(0)} MB/day';
  }

  /// Calculate delay needed to throttle transfer
  Duration calculateThrottleDelay(int bytesTransferred, int speedLimit) {
    final expectedDuration = Duration(
      milliseconds: (bytesTransferred / speedLimit * 1000).round(),
    );
    return expectedDuration;
  }
}
