import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../core/theme/colors.dart';

/// Pulsing radar animation widget for the Receive Hub
class PulsingRadar extends StatelessWidget {
  final int numCircles;
  final double mainCircleSize;
  final Color? color;
  final Widget? centerWidget;
  final bool isActive;

  const PulsingRadar({
    super.key,
    this.numCircles = 5,
    this.mainCircleSize = 280,
    this.color,
    this.centerWidget,
    this.isActive = true,
  });

  @override
  Widget build(BuildContext context) {
    final radarColor = color ?? AppColors.violet500;

    return SizedBox(
      width: mainCircleSize * 2,
      height: mainCircleSize * 2,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Animated concentric circles
          if (isActive)
            ...List.generate(numCircles, (index) {
              final delay = Duration(milliseconds: index * 400);
              final size = mainCircleSize * (0.5 + (index * 0.15));

              return _RadarCircle(
                size: size,
                color: radarColor,
                delay: delay,
              );
            }),

          // Static background circles
          ...List.generate(3, (index) {
            final size = mainCircleSize * (0.4 + (index * 0.25));
            return Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: radarColor.withOpacity(0.1),
                  width: 1,
                ),
              ),
            );
          }),

          // Center widget
          if (centerWidget != null) centerWidget!,
        ],
      ),
    );
  }
}

class _RadarCircle extends StatelessWidget {
  final double size;
  final Color color;
  final Duration delay;

  const _RadarCircle({
    required this.size,
    required this.color,
    required this.delay,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 2,
        ),
      ),
    )
        .animate(
          onPlay: (controller) => controller.repeat(),
          delay: delay,
        )
        .scaleXY(
          begin: 0.6,
          end: 1.5,
          duration: 2500.ms,
          curve: Curves.easeOut,
        )
        .fadeOut(
          begin: 0.6,
          duration: 2500.ms,
          curve: Curves.easeOut,
        );
  }
}

/// Radar sweep line animation
class RadarSweep extends StatelessWidget {
  final double size;
  final Color color;

  const RadarSweep({
    super.key,
    this.size = 280,
    this.color = AppColors.violet500,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _RadarSweepPainter(color: color),
      ),
    )
        .animate(onPlay: (controller) => controller.repeat())
        .rotate(duration: 3.seconds);
  }
}

class _RadarSweepPainter extends CustomPainter {
  final Color color;

  _RadarSweepPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    final gradient = SweepGradient(
      colors: [
        color.withOpacity(0.0),
        color.withOpacity(0.0),
        color.withOpacity(0.3),
        color.withOpacity(0.0),
      ],
      stops: const [0.0, 0.5, 0.75, 1.0],
    );

    final paint = Paint()
      ..shader = gradient.createShader(
        Rect.fromCircle(center: center, radius: radius),
      );

    canvas.drawCircle(center, radius, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
