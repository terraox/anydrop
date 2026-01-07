import 'dart:ui';
import 'package:flutter/material.dart';
import '../core/theme/colors.dart';

/// Glassmorphic container widget matching web app's frosted glass effect
class GlassmorphicContainer extends StatelessWidget {
  final Widget child;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final double blur;
  final Color? borderColor;
  final double borderWidth;
  final Gradient? gradient;

  const GlassmorphicContainer({
    super.key,
    required this.child,
    this.width,
    this.height,
    this.padding,
    this.margin,
    this.borderRadius = 16,
    this.blur = 20,
    this.borderColor,
    this.borderWidth = 1,
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      width: width,
      height: height,
      margin: margin,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: Container(
            padding: padding,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(borderRadius),
              gradient: gradient ?? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: isDark
                    ? [
                        AppColors.zinc900.withOpacity(0.5),
                        AppColors.zinc900.withOpacity(0.3),
                      ]
                    : [
                        Colors.white.withOpacity(0.6),
                        Colors.white.withOpacity(0.4),
                      ],
              ),
              border: Border.all(
                color: borderColor ?? 
                    (isDark 
                        ? Colors.white.withOpacity(0.1) 
                        : Colors.white.withOpacity(0.5)),
                width: borderWidth,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(isDark ? 0.3 : 0.1),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}

/// Glassmorphic card with tap support
class GlassmorphicCard extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double borderRadius;
  final EdgeInsetsGeometry? padding;

  const GlassmorphicCard({
    super.key,
    required this.child,
    this.onTap,
    this.borderRadius = 16,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: GlassmorphicContainer(
        borderRadius: borderRadius,
        padding: padding ?? const EdgeInsets.all(16),
        child: child,
      ),
    );
  }
}
