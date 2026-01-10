import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:sensors_plus/sensors_plus.dart';
import '../../core/theme/colors.dart';
import '../../services/websocket_service.dart';
import '../../widgets/glassmorphic_container.dart';
import 'dart:math' as math;

/// Trackpad and Sentry Mode screen
class TrackpadScreen extends StatefulWidget {
  const TrackpadScreen({super.key});

  @override
  State<TrackpadScreen> createState() => _TrackpadScreenState();
}

class _TrackpadScreenState extends State<TrackpadScreen>
    with SingleTickerProviderStateMixin {
  final WebSocketService _wsService = WebSocketService();
  bool _isTrackpadMode = true;
  bool _sentryActive = false;

  // Sentry mode
  StreamSubscription<AccelerometerEvent>? _accelerometerSubscription;
  double _motionMagnitude = 0.0;
  final double _motionThreshold = 2.0;
  bool _alertTriggered = false;
  List<double> _motionHistory = [];

  @override
  void initState() {
    super.initState();
    // NOTE: Trackpad uses WebSocketService (STOMP) for main server connection
    // This is NOT used for local file transfer
    // For local file transfer, use TransferService.connectToReceiver() with discovered IP
    // Trackpad requires device IP/port - do not use without parameters
    // _wsService.connect(); // DISABLED - requires deviceIp and devicePort
  }

  @override
  void dispose() {
    _accelerometerSubscription?.cancel();
    _wsService.disconnect();
    super.dispose();
  }

  void _startSentryMode() {
    setState(() {
      _sentryActive = true;
      _alertTriggered = false;
      _motionHistory = [];
    });

    _accelerometerSubscription = accelerometerEvents.listen((event) {
      final magnitude = math.sqrt(
        event.x * event.x + event.y * event.y + event.z * event.z,
      );

      // Remove gravity (~9.8)
      final adjustedMagnitude = (magnitude - 9.8).abs();

      setState(() {
        _motionMagnitude = adjustedMagnitude;
        _motionHistory.add(adjustedMagnitude);
        if (_motionHistory.length > 50) {
          _motionHistory.removeAt(0);
        }
      });

      if (adjustedMagnitude > _motionThreshold && !_alertTriggered) {
        _triggerAlert();
      }
    });
  }

  void _stopSentryMode() {
    _accelerometerSubscription?.cancel();
    setState(() {
      _sentryActive = false;
      _motionMagnitude = 0.0;
    });
  }

  void _triggerAlert() {
    setState(() => _alertTriggered = true);
    _wsService.sendSentryAlert(_motionMagnitude);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(LucideIcons.alertTriangle, color: Colors.white),
            const SizedBox(width: 12),
            const Text('Motion detected! Alert sent.'),
          ],
        ),
        backgroundColor: AppColors.red500,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );

    // Reset after 3 seconds
    Timer(const Duration(seconds: 3), () {
      if (mounted) setState(() => _alertTriggered = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    // Theme used in child widgets
    Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(_isTrackpadMode ? 'Trackpad' : 'Sentry Mode'),
        actions: [
          // Mode toggle
          IconButton(
            onPressed: () {
              if (!_isTrackpadMode && _sentryActive) {
                _stopSentryMode();
              }
              setState(() => _isTrackpadMode = !_isTrackpadMode);
            },
            icon: Icon(
              _isTrackpadMode ? LucideIcons.shield : LucideIcons.mousePointer,
            ),
          ),
        ],
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: _isTrackpadMode ? _buildTrackpad() : _buildSentryMode(),
      ),
    );
  }

  Widget _buildTrackpad() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Instructions
            GlassmorphicContainer(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(
                    LucideIcons.mousePointer,
                    size: 20,
                    color: AppColors.violet500,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Universal Control',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.white : AppColors.zinc900,
                          ),
                        ),
                        Text(
                          'Swipe to control cursor on connected devices',
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark
                                ? AppColors.zinc400
                                : AppColors.zinc500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn().slideY(begin: -0.2),

            const SizedBox(height: 20),

            // Trackpad surface
            Expanded(
              child: GestureDetector(
                onPanUpdate: (details) {
                  _wsService.sendTrackpadData(
                    details.localPosition.dx,
                    details.localPosition.dy,
                  );
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: isDark
                        ? AppColors.zinc900.withOpacity(0.5)
                        : AppColors.zinc100,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isDark
                          ? AppColors.zinc800
                          : AppColors.zinc200,
                      width: 2,
                    ),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          LucideIcons.move,
                          size: 48,
                          color: isDark
                              ? AppColors.zinc700
                              : AppColors.zinc300,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Swipe here',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: isDark
                                ? AppColors.zinc600
                                : AppColors.zinc400,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSentryMode() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        gradient: RadialGradient(
          center: Alignment.center,
          radius: 1,
          colors: [
            (_alertTriggered ? AppColors.red500 : AppColors.red500)
                .withOpacity(_alertTriggered ? 0.3 : 0.1),
            Colors.transparent,
          ],
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              // Status card
              GlassmorphicContainer(
                padding: const EdgeInsets.all(20),
                borderColor: _sentryActive
                    ? AppColors.red500.withOpacity(0.5)
                    : null,
                child: Column(
                  children: [
                    Icon(
                      _sentryActive
                          ? (_alertTriggered
                              ? LucideIcons.alertTriangle
                              : LucideIcons.shieldCheck)
                          : LucideIcons.shield,
                      size: 48,
                      color: _sentryActive
                          ? (_alertTriggered
                              ? AppColors.red500
                              : AppColors.emerald500)
                          : AppColors.zinc400,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _sentryActive
                          ? (_alertTriggered ? 'MOTION DETECTED!' : 'ARMED')
                          : 'DISARMED',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 2,
                        color: _sentryActive
                            ? (_alertTriggered
                                ? AppColors.red500
                                : AppColors.emerald500)
                            : (isDark ? AppColors.zinc400 : AppColors.zinc500),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _sentryActive
                          ? 'Monitoring device movement'
                          : 'Tap to activate sentry mode',
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark
                            ? AppColors.zinc400
                            : AppColors.zinc500,
                      ),
                    ),
                  ],
                ),
              )
                  .animate(
                    target: _alertTriggered ? 1 : 0,
                  )
                  .shake(hz: 5, duration: 500.ms),

              const SizedBox(height: 24),

              // Motion graph
              if (_sentryActive) ...[
                Text(
                  'MOTION LEVEL',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.5,
                    color: isDark ? AppColors.zinc400 : AppColors.zinc500,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  height: 100,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isDark
                        ? AppColors.zinc900.withOpacity(0.5)
                        : AppColors.zinc100,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark ? AppColors.zinc800 : AppColors.zinc200,
                    ),
                  ),
                  child: CustomPaint(
                    size: const Size(double.infinity, 76),
                    painter: _MotionGraphPainter(
                      values: _motionHistory,
                      threshold: _motionThreshold,
                      color: _alertTriggered
                          ? AppColors.red500
                          : AppColors.violet500,
                    ),
                  ),
                ).animate().fadeIn(),

                const SizedBox(height: 12),
                Text(
                  'Current: ${_motionMagnitude.toStringAsFixed(2)}',
                  style: TextStyle(
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: isDark ? AppColors.zinc400 : AppColors.zinc500,
                  ),
                ),
              ],

              const Spacer(),

              // Arm/Disarm button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () {
                    if (_sentryActive) {
                      _stopSentryMode();
                    } else {
                      _startSentryMode();
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        _sentryActive ? AppColors.zinc700 : AppColors.red500,
                  ),
                  child: Text(
                    _sentryActive ? 'DISARM' : 'ARM SENTRY MODE',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MotionGraphPainter extends CustomPainter {
  final List<double> values;
  final double threshold;
  final Color color;

  _MotionGraphPainter({
    required this.values,
    required this.threshold,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (values.isEmpty) return;

    final paint = Paint()
      ..color = color
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();
    final maxValue = math.max(threshold * 2, values.reduce(math.max));
    final stepX = size.width / (values.length - 1).clamp(1, 100);

    for (int i = 0; i < values.length; i++) {
      final x = i * stepX;
      final y = size.height - (values[i] / maxValue * size.height);

      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    canvas.drawPath(path, paint);

    // Draw threshold line
    final thresholdY = size.height - (threshold / maxValue * size.height);
    final thresholdPaint = Paint()
      ..color = AppColors.red500.withOpacity(0.5)
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;

    canvas.drawLine(
      Offset(0, thresholdY),
      Offset(size.width, thresholdY),
      thresholdPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _MotionGraphPainter oldDelegate) {
    return oldDelegate.values != values;
  }
}
