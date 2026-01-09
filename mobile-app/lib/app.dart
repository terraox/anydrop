import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'providers/auth_provider.dart';
import 'providers/device_provider.dart';
import 'providers/theme_provider.dart';
import 'services/transfer_service.dart';
import 'screens/auth/login_screen.dart';
import 'screens/receive/receive_hub.dart';
import 'screens/send/send_hub.dart';
import 'screens/settings/settings_screen.dart';
import 'screens/trackpad/trackpad_screen.dart';
import 'widgets/bottom_nav_bar.dart';

/// Main App widget
class AnyDropApp extends StatelessWidget {
  const AnyDropApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => DeviceProvider()),
        ChangeNotifierProvider(create: (_) => TransferService()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, _) {
          return MaterialApp(
            title: 'AnyDrop',
            debugShowCheckedModeBanner: false,
            theme: themeProvider.theme,
            home: const _AppRouter(),
          );
        },
      ),
    );
  }
}

/// App router that handles auth state
class _AppRouter extends StatelessWidget {
  const _AppRouter();

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    // Show loading while checking auth
    if (authProvider.isLoading) {
      return const _SplashScreen();
    }

    // Show login if not authenticated
    if (!authProvider.isAuthenticated) {
      return const LoginScreen();
    }

    // Show main app
    return const MainScreen();
  }
}

/// Splash screen shown during initial load
class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Icon(
                LucideIcons.zap,
                size: 48,
                color: Theme.of(context).primaryColor,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'AnyDrop',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : Colors.black,
              ),
            ),
            const SizedBox(height: 16),
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ],
        ),
      ),
    );
  }
}

/// Main screen with bottom navigation
class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  bool _isDialogShowing = false;

  final _screens = const [
    ReceiveHub(),
    SendHub(),
    SettingsScreen(),
  ];

  @override
  void initState() {
    super.initState();
    // Connect to WebSocket with auth token
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final authProvider = context.read<AuthProvider>();
      final deviceProvider = context.read<DeviceProvider>();
      final transferService = context.read<TransferService>();
      
      // Wait for deviceProvider to initialize and get IP
      await Future.delayed(const Duration(milliseconds: 1000));
      
      // Use persistent UUID for all registrations to ensure consistency
      final deviceId = deviceProvider.deviceId;
      debugPrint('📡 Registering to transfer with deviceId: $deviceId');
      transferService.connect(deviceId);
      
      if (authProvider.token != null) {
        deviceProvider.connectToServer(token: authProvider.token);
      }
      
      // Listen for incoming transfers (both old and new service)
      deviceProvider.addListener(_checkIncomingTransfer);
      transferService.addListener(_checkUnifiedTransfer);
    });
  }

  @override
  void dispose() {
    context.read<DeviceProvider>().removeListener(_checkIncomingTransfer);
    context.read<TransferService>().removeListener(_checkUnifiedTransfer);
    super.dispose();
  }

  void _checkUnifiedTransfer() {
    if (!mounted) return;
    final transferService = context.read<TransferService>();
    
    if (transferService.pendingRequest != null && !_isDialogShowing) {
      _showUnifiedTransferDialog(transferService);
    }
  }

  void _showUnifiedTransferDialog(TransferService service) async {
    _isDialogShowing = true;
    final request = service.pendingRequest!;
    final fileName = request['fileName'] ?? 'Unknown';
    final sizeBytes = request['size'] ?? 0;
    final sizeMB = (sizeBytes / 1024 / 1024).toStringAsFixed(2);
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(LucideIcons.download, color: Theme.of(context).primaryColor),
            const SizedBox(width: 12),
            const Text('Incoming File'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('File: $fileName', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Size: $sizeMB MB'),
            const SizedBox(height: 16),
            const Text(
              'Choose where to save this file',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              service.rejectTransfer();
              Navigator.of(ctx).pop();
              _isDialogShowing = false;
            },
            child: const Text('Decline'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              _isDialogShowing = false;
              
              // Show save location picker
              final savePath = await service.chooseSaveLocation(fileName);
              if (savePath != null) {
                // Accept with custom save path
                await service.acceptTransfer(savePath: savePath);
              } else {
                // User cancelled save location, but still accept with default location
                await service.acceptTransfer();
              }
            },
            child: const Text('Accept & Choose Location'),
          ),
        ],
      ),
    );
  }

  void _checkIncomingTransfer() {
    if (!mounted) return;
    final provider = context.read<DeviceProvider>();
    
    if (provider.incomingTransfer != null && !_isDialogShowing) {
      _showTransferDialog(provider);
    }
  }

  void _showTransferDialog(DeviceProvider provider) {
    if (_isDialogShowing) return;
    
    final transfer = provider.incomingTransfer!;
    setState(() => _isDialogShowing = true);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Incoming File'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('From: Server'), // Ideally source device name
            const SizedBox(height: 8),
            Text('File: ${transfer.name}'),
            Text('Size: ${transfer.formattedSize}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              provider.rejectTransfer();
              Navigator.pop(ctx);
              setState(() => _isDialogShowing = false);
            },
            child: const Text('Reject', style: TextStyle(color: Colors.red)),
          ),
          FilledButton(
            onPressed: () {
              provider.acceptTransfer();
              Navigator.pop(ctx);
              setState(() => _isDialogShowing = false);
              
              // Show success snackbar for now
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Downloading ${transfer.name}...'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            child: const Text('Accept'),
          ),
        ],
      ),
    ).then((_) {
       // Ensure flag is reset if dialog blocked/closed
       if (mounted) setState(() => _isDialogShowing = false);
       if (provider.incomingTransfer != null) {
          // If transfer still exists but dialog closed, clear it (e.g. back button)
          provider.clearIncomingTransfer();
       }
    });
  }

  void _onNavTap(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      extendBody: true,
      floatingActionButton: _currentIndex != 2
          ? FloatingActionButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const TrackpadScreen(),
                  ),
                );
              },
              backgroundColor: Theme.of(context).primaryColor,
              child: const Icon(Icons.touch_app, color: Colors.white),
            )
          : null,
      bottomNavigationBar: GlassmorphicBottomNav(
        currentIndex: _currentIndex,
        onTap: _onNavTap,
      ),
    );
  }
}
