import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../core/theme/colors.dart';
import '../models/device.dart';
import 'glassmorphic_container.dart';

/// Device card widget for displaying nearby devices
class DeviceCard extends StatelessWidget {
  final Device device;
  final VoidCallback? onTap;
  final bool isSelected;

  const DeviceCard({
    super.key,
    required this.device,
    this.onTap,
    this.isSelected = false,
  });

  IconData get _deviceIcon {
    switch (device.type) {
      case 'phone':
        return LucideIcons.smartphone;
      case 'tablet':
        return LucideIcons.tablet;
      case 'laptop':
        return LucideIcons.laptop;
      case 'desktop':
        return LucideIcons.monitor;
      default:
        return LucideIcons.monitor;
    }
  }

  Color get _statusColor {
    switch (device.status) {
      case DeviceStatus.online:
        return AppColors.emerald500;
      case DeviceStatus.busy:
      case DeviceStatus.receiving:
        return AppColors.amber500;
      case DeviceStatus.offline:
        return AppColors.zinc500;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: device.isOnline ? onTap : null,
      child: GlassmorphicContainer(
        width: 100,
        padding: const EdgeInsets.all(12),
        borderColor: isSelected ? AppColors.violet500 : null,
        borderWidth: isSelected ? 2 : 1,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Device icon with status indicator
            Stack(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isDark
                        ? AppColors.zinc800.withOpacity(0.5)
                        : AppColors.zinc100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _deviceIcon,
                    size: 28,
                    color: isDark ? AppColors.zinc300 : AppColors.zinc600,
                  ),
                ),
                Positioned(
                  right: 0,
                  top: 0,
                  child: Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: _statusColor,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isDark ? AppColors.zinc900 : Colors.white,
                        width: 2,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Device name
            Text(
              device.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.white : AppColors.zinc900,
              ),
            ),

            // Status text
            Text(
              device.statusText,
              style: TextStyle(
                fontSize: 9,
                color: _statusColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Shimmer loading placeholder for device cards
class DeviceCardShimmer extends StatelessWidget {
  const DeviceCardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassmorphicContainer(
      width: 100,
      padding: const EdgeInsets.all(12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Icon placeholder
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: isDark
                  ? AppColors.zinc800.withOpacity(0.5)
                  : AppColors.zinc200,
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          const SizedBox(height: 8),

          // Name placeholder
          Container(
            width: 60,
            height: 10,
            decoration: BoxDecoration(
              color: isDark
                  ? AppColors.zinc800.withOpacity(0.5)
                  : AppColors.zinc200,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 4),

          // Status placeholder
          Container(
            width: 40,
            height: 8,
            decoration: BoxDecoration(
              color: isDark
                  ? AppColors.zinc800.withOpacity(0.3)
                  : AppColors.zinc100,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ],
      ),
    );
  }
}
