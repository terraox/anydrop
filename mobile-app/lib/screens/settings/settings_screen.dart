import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/device_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/glassmorphic_container.dart';

/// Settings screen with grouped sections
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _isEditingName = false;
  late TextEditingController _nameController;

  // Settings
  bool _saveToGallery = true;
  bool _requirePin = false;

  @override
  void initState() {
    super.initState();
    final deviceProvider = context.read<DeviceProvider>();
    _nameController = TextEditingController(text: deviceProvider.deviceName);
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final authProvider = context.watch<AuthProvider>();
    final deviceProvider = context.watch<DeviceProvider>();
    final isDark = themeProvider.isDark;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Text(
                'SETTINGS',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 2,
                  color: AppColors.violet500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Configure your neural interface',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 24),

              // Identity Card
              _buildSection(
                title: 'IDENTITY',
                children: [
                  GlassmorphicContainer(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        // Avatar
                        Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            color: AppColors.violet500.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: AppColors.violet500.withOpacity(0.3),
                              width: 2,
                            ),
                          ),
                          child: Icon(
                            LucideIcons.smartphone,
                            size: 28,
                            color: AppColors.violet500,
                          ),
                        ),
                        const SizedBox(width: 16),

                        // Name
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Device Name',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark
                                      ? AppColors.zinc400
                                      : AppColors.zinc500,
                                ),
                              ),
                              const SizedBox(height: 4),
                              _isEditingName
                                  ? TextField(
                                      controller: _nameController,
                                      autofocus: true,
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        color: isDark
                                            ? Colors.white
                                            : AppColors.zinc900,
                                      ),
                                      decoration: const InputDecoration(
                                        isDense: true,
                                        contentPadding: EdgeInsets.zero,
                                        border: InputBorder.none,
                                      ),
                                      onSubmitted: (value) {
                                        deviceProvider.setDeviceName(value);
                                        setState(() => _isEditingName = false);
                                      },
                                    )
                                  : GestureDetector(
                                      onTap: () =>
                                          setState(() => _isEditingName = true),
                                      child: Row(
                                        children: [
                                          Text(
                                            deviceProvider.deviceName,
                                            style: TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w600,
                                              color: isDark
                                                  ? Colors.white
                                                  : AppColors.zinc900,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Icon(
                                            LucideIcons.pencil,
                                            size: 14,
                                            color: AppColors.zinc400,
                                          ),
                                        ],
                                      ),
                                    ),
                            ],
                          ),
                        ),

                        // ID Badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.violet500,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            deviceProvider.deviceId,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Appearance
              _buildSection(
                title: 'APPEARANCE',
                children: [
                  _SettingsCard(
                    icon: LucideIcons.moon,
                    title: 'Interface Theme',
                    child: _ThemeToggle(
                      currentTheme: themeProvider.themeMode,
                      onThemeChanged: themeProvider.setThemeMode,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Receive Rules
              _buildSection(
                title: 'RECEIVE',
                children: [
                  _SettingsCard(
                    icon: LucideIcons.image,
                    title: 'Save media to gallery',
                    subtitle: 'Automatically save photos and videos',
                    trailing: Switch.adaptive(
                      value: _saveToGallery,
                      onChanged: (value) =>
                          setState(() => _saveToGallery = value),
                      activeColor: AppColors.violet500,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _SettingsCard(
                    icon: LucideIcons.lock,
                    title: 'Require PIN',
                    subtitle: 'Ask for PIN before receiving',
                    trailing: Switch.adaptive(
                      value: _requirePin,
                      onChanged: (value) =>
                          setState(() => _requirePin = value),
                      activeColor: AppColors.violet500,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _SettingsCard(
                    icon: LucideIcons.folderOpen,
                    title: 'Destination folder',
                    subtitle: 'Downloads/AnyDrop',
                    trailing: Icon(
                      LucideIcons.chevronRight,
                      size: 18,
                      color: AppColors.zinc400,
                    ),
                    onTap: () {
                      // Open folder picker
                    },
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Account & Security
              _buildSection(
                title: 'ACCOUNT',
                children: [
                  _SettingsCard(
                    icon: LucideIcons.user,
                    title: 'Profile',
                    subtitle: authProvider.user?.email ?? 'Not logged in',
                    trailing: Icon(
                      LucideIcons.chevronRight,
                      size: 18,
                      color: AppColors.zinc400,
                    ),
                    onTap: () {
                      // Navigate to profile
                    },
                  ),
                  const SizedBox(height: 12),
                  _SettingsCard(
                    icon: LucideIcons.crown,
                    title: 'Plan',
                    subtitle: authProvider.isTitan ? 'Titan' : 'Scout',
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: authProvider.isTitan
                            ? AppColors.violet500
                            : AppColors.zinc700,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        authProvider.isTitan ? 'PRO' : 'FREE',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    onTap: () {
                      // Navigate to upgrade
                    },
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Danger Zone
              _buildSection(
                title: 'DANGER ZONE',
                titleColor: AppColors.red500,
                children: [
                  _SettingsCard(
                    icon: LucideIcons.logOut,
                    iconColor: AppColors.red500,
                    title: 'Log out',
                    subtitle: 'Sign out of this device',
                    onTap: () => _showLogoutConfirmation(context),
                  ),
                ],
              ),

              const SizedBox(height: 100), // Bottom nav spacing
            ]
                .animate(interval: 50.ms)
                .fadeIn(duration: 300.ms)
                .slideY(begin: 0.1, duration: 300.ms),
          ),
        ),
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required List<Widget> children,
    Color? titleColor,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.5,
            color: titleColor ?? (isDark ? AppColors.zinc400 : AppColors.zinc500),
          ),
        ),
        const SizedBox(height: 12),
        ...children,
      ],
    );
  }

  void _showLogoutConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Log out?'),
        content: const Text('Are you sure you want to log out of this device?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              context.read<AuthProvider>().logout();
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.red500),
            child: const Text('Log out'),
          ),
        ],
      ),
    );
  }
}

class _SettingsCard extends StatelessWidget {
  final IconData icon;
  final Color? iconColor;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final Widget? child;
  final VoidCallback? onTap;

  const _SettingsCard({
    required this.icon,
    this.iconColor,
    required this.title,
    this.subtitle,
    this.trailing,
    this.child,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: GlassmorphicContainer(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: (iconColor ?? AppColors.violet500).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    icon,
                    size: 18,
                    color: iconColor ?? AppColors.violet500,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white : AppColors.zinc900,
                        ),
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          subtitle!,
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark
                                ? AppColors.zinc400
                                : AppColors.zinc500,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
            if (child != null) ...[
              const SizedBox(height: 16),
              child!,
            ],
          ],
        ),
      ),
    );
  }
}

class _ThemeToggle extends StatelessWidget {
  final AppThemeMode currentTheme;
  final Function(AppThemeMode) onThemeChanged;

  const _ThemeToggle({
    required this.currentTheme,
    required this.onThemeChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: isDark ? AppColors.zinc900 : AppColors.zinc200,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          _ThemeButton(
            icon: LucideIcons.sun,
            label: 'Light',
            isSelected: currentTheme == AppThemeMode.light,
            onTap: () => onThemeChanged(AppThemeMode.light),
          ),
          _ThemeButton(
            icon: LucideIcons.moon,
            label: 'Dark',
            isSelected: currentTheme == AppThemeMode.dark,
            onTap: () => onThemeChanged(AppThemeMode.dark),
          ),
          _ThemeButton(
            icon: LucideIcons.monitor,
            label: 'OLED',
            isSelected: currentTheme == AppThemeMode.oled,
            onTap: () => onThemeChanged(AppThemeMode.oled),
          ),
        ],
      ),
    );
  }
}

class _ThemeButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _ThemeButton({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected
                ? (isDark ? AppColors.zinc800 : Colors.white)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Column(
            children: [
              Icon(
                icon,
                size: 18,
                color: isSelected
                    ? AppColors.violet500
                    : (isDark ? AppColors.zinc500 : AppColors.zinc400),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  color: isSelected
                      ? AppColors.violet500
                      : (isDark ? AppColors.zinc500 : AppColors.zinc400),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
