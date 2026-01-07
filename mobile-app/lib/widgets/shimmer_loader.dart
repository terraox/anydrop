import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../core/theme/colors.dart';

/// Shimmer loading effect widget
class ShimmerLoader extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;
  final Widget? child;

  const ShimmerLoader({
    super.key,
    this.width = double.infinity,
    this.height = 20,
    this.borderRadius = 8,
    this.child,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final shimmerWidget = Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: isDark ? AppColors.zinc800 : AppColors.zinc200,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    )
        .animate(onPlay: (controller) => controller.repeat())
        .shimmer(
          duration: 1500.ms,
          color: isDark
              ? AppColors.zinc700.withOpacity(0.5)
              : Colors.white.withOpacity(0.5),
        );

    return child != null
        ? Stack(
            children: [
              child!,
              Positioned.fill(child: shimmerWidget),
            ],
          )
        : shimmerWidget;
  }
}

/// Skeleton loading placeholder
class SkeletonLoader extends StatelessWidget {
  final List<SkeletonItem> items;
  final EdgeInsetsGeometry padding;

  const SkeletonLoader({
    super.key,
    required this.items,
    this.padding = EdgeInsets.zero,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: items.map((item) {
          return Padding(
            padding: EdgeInsets.only(bottom: item.spacing),
            child: ShimmerLoader(
              width: item.width,
              height: item.height,
              borderRadius: item.borderRadius,
            ),
          );
        }).toList(),
      ),
    );
  }
}

/// Skeleton item configuration
class SkeletonItem {
  final double width;
  final double height;
  final double borderRadius;
  final double spacing;

  const SkeletonItem({
    this.width = double.infinity,
    this.height = 16,
    this.borderRadius = 8,
    this.spacing = 8,
  });
}

/// Common skeleton patterns
class SkeletonPatterns {
  static List<SkeletonItem> get card => [
        const SkeletonItem(height: 120, borderRadius: 16),
        const SkeletonItem(width: 200, height: 20, spacing: 12),
        const SkeletonItem(width: 150, height: 14),
      ];

  static List<SkeletonItem> get listItem => [
        const SkeletonItem(height: 60, borderRadius: 12),
      ];

  static List<SkeletonItem> get text => [
        const SkeletonItem(width: 200, height: 16),
        const SkeletonItem(height: 14),
        const SkeletonItem(width: 150, height: 14),
      ];
}
