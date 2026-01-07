import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../core/theme/colors.dart';
import '../../providers/device_provider.dart';
import '../../widgets/glassmorphic_container.dart';
import '../../widgets/pulsing_radar.dart';
import '../../widgets/segmented_control.dart';

/// Receive Hub screen - Main radar view for receiving files
class ReceiveHub extends StatefulWidget {
  const ReceiveHub({super.key});

  @override
  State<ReceiveHub> createState() => _ReceiveHubState();
}

class _ReceiveHubState extends State<ReceiveHub> {
  bool _isReceiving = false;

  @override
  void initState() {
    super.initState();
    // Start scanning for nearby devices
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DeviceProvider>().startScanning();
    });
  }

  @override
  Widget build(BuildContext context) {
    final deviceProvider = context.watch<DeviceProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Stack(
        children: [
          // Background gradient
          Container(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: Alignment.center,
                radius: 1.5,
                colors: [
                  (_isReceiving ? AppColors.violet500 : AppColors.violet500)
                      .withOpacity(isDark ? 0.1 : 0.05),
                  Colors.transparent,
                ],
              ),
            ),
          ),

          // Main content
          SafeArea(
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'RECEIVE',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 2,
                              color: AppColors.violet500,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Ready to Accept',
                            style: Theme.of(context).textTheme.headlineMedium,
                          ),
                        ],
                      ),
                      // Connection status
                      GlassmorphicContainer(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        borderRadius: 20,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: deviceProvider.isConnected
                                    ? AppColors.emerald500
                                    : AppColors.amber500,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              deviceProvider.isConnected ? 'Online' : 'Offline',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.white : AppColors.zinc900,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Radar area
                Expanded(
                  child: Center(
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Pulsing radar
                        PulsingRadar(
                          numCircles: 6,
                          mainCircleSize: size.width * 0.4,
                          color: _isReceiving
                              ? AppColors.violet500
                              : isDark
                                  ? AppColors.zinc700
                                  : AppColors.zinc300,
                          isActive: true,
                        ),

                        // Center device info card
                        GlassmorphicContainer(
                          padding: const EdgeInsets.all(24),
                          borderRadius: 100,
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Device ID badge
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.violet500,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  deviceProvider.deviceId,
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),

                              // Device icon
                              Icon(
                                LucideIcons.smartphone,
                                size: 32,
                                color: isDark ? Colors.white : AppColors.zinc900,
                              ),
                              const SizedBox(height: 8),

                              // Device name
                              Text(
                                deviceProvider.deviceName,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: isDark ? Colors.white : AppColors.zinc900,
                                ),
                              ),
                            ],
                          ),
                        ).animate().scale(
                              duration: 600.ms,
                              curve: Curves.elasticOut,
                            ),
                      ],
                    ),
                  ),
                ),

                // Quick Save toggle
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Text(
                        'QUICK SAVE',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 2,
                          color: isDark ? AppColors.zinc400 : AppColors.zinc500,
                        ),
                      ),
                      const SizedBox(height: 12),
                      QuickSaveControl(
                        selectedMode: deviceProvider.quickSaveMode.name,
                        onModeChanged: (mode) {
                          deviceProvider.setQuickSaveMode(
                            QuickSaveMode.values.firstWhere(
                              (m) => m.name == mode,
                              orElse: () => QuickSaveMode.off,
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _getQuickSaveDescription(deviceProvider.quickSaveMode),
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? AppColors.zinc500 : AppColors.zinc400,
                        ),
                      ),
                    ],
                  ),
                ),

                // Nearby devices count
                if (deviceProvider.nearbyDevices.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 100),
                    child: GlassmorphicContainer(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      borderRadius: 20,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            LucideIcons.wifi,
                            size: 16,
                            color: AppColors.violet500,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '${deviceProvider.nearbyDevices.length} devices nearby',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isDark ? Colors.white : AppColors.zinc900,
                            ),
                          ),
                        ],
                      ),
                    ).animate().fadeIn().slideY(begin: 0.3),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getQuickSaveDescription(QuickSaveMode mode) {
    switch (mode) {
      case QuickSaveMode.off:
        return 'Ask before saving received files';
      case QuickSaveMode.favourites:
        return 'Auto-save from trusted devices only';
      case QuickSaveMode.on:
        return 'Automatically save all received files';
    }
  }
}
