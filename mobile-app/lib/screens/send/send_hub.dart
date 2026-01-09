import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../core/theme/colors.dart';
import '../../models/device.dart';
import '../../providers/device_provider.dart';
import '../../services/file_service.dart';
import '../../services/transfer_service.dart';
import '../../widgets/device_card.dart';
import '../../widgets/glassmorphic_container.dart';

/// Send Hub screen - File selection and device targeting
class SendHub extends StatefulWidget {
  const SendHub({super.key});

  @override
  State<SendHub> createState() => _SendHubState();
}

class _SendHubState extends State<SendHub> {
  final FileService _fileService = FileService();
  Device? _selectedDevice;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DeviceProvider>().startScanning();
    });
  }

  void _onCategoryTap(String category) async {
    switch (category) {
      case 'file':
        final files = await _fileService.pickFiles();
        if (files != null && files.isNotEmpty) {
          _handleFilesSelected(files);
        }
        break;
      case 'media':
        final files = await _fileService.pickMedia();
        if (files != null && files.isNotEmpty) {
          _handleFilesSelected(files);
        }
        break;
      case 'paste':
        _handlePaste();
        break;
      case 'text':
        _showTextInput();
        break;
    }
  }

  void _handleFilesSelected(List<dynamic> files) {
    if (_selectedDevice == null) {
      // No device selected - show message to select one first
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${files.length} file(s) selected. Now select a device to send to.'),
          backgroundColor: AppColors.violet500,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      // Store files for later sending
      setState(() {
        _pendingFiles = files;
      });
    } else {
      // Device already selected - send immediately
      _sendFilesToDevice(files, _selectedDevice!);
    }
  }

  List<dynamic>? _pendingFiles;

  void _sendFilesToDevice(List<dynamic> files, Device device) async {
    final transferService = context.read<TransferService>();
    
    for (final file in files) {
      if (file.path != null) {
        final transferId = DateTime.now().millisecondsSinceEpoch.toString();
        
        // Use the transfer service for P2P
        await transferService.sendFile(
          device.id,
          File(file.path!),
          transferId,
        );
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Sending ${file.name} to ${device.name}...'),
            backgroundColor: AppColors.violet500,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    }
    
    // Clear pending files
    setState(() {
      _pendingFiles = null;
    });
  }

  void _showFilesSelected(int count) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$count file(s) selected'),
        backgroundColor: AppColors.violet500,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _handlePaste() async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    if (data != null && data.text != null && data.text!.isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Clipboard content ready to send'),
          backgroundColor: AppColors.violet500,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Clipboard is empty'),
          backgroundColor: AppColors.zinc700,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  void _showTextInput() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _TextInputSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final deviceProvider = context.watch<DeviceProvider>();
    final transferService = context.watch<TransferService>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    // Check if transfer completed and clear selected device
    if (!transferService.isSending && _selectedDevice != null && transferService.progress >= 1.0) {
      // Transfer completed - clear selection after a brief delay
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          setState(() {
            _selectedDevice = null;
          });
        }
      });
    }

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Text(
                'SEND',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 2,
                  color: AppColors.violet500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'What would you like to share?',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 24),

              // Category grid
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 1.2,
                children: [
                  _CategoryCard(
                    icon: LucideIcons.folder,
                    label: 'File',
                    description: 'Documents, PDFs',
                    color: AppColors.violet500,
                    onTap: () => _onCategoryTap('file'),
                  ),
                  _CategoryCard(
                    icon: LucideIcons.image,
                    label: 'Media',
                    description: 'Photos & Videos',
                    color: AppColors.emerald500,
                    onTap: () => _onCategoryTap('media'),
                  ),
                  _CategoryCard(
                    icon: LucideIcons.clipboard,
                    label: 'Paste',
                    description: 'From clipboard',
                    color: AppColors.amber500,
                    onTap: () => _onCategoryTap('paste'),
                  ),
                  _CategoryCard(
                    icon: LucideIcons.type,
                    label: 'Text',
                    description: 'Type a message',
                    color: AppColors.red500,
                    onTap: () => _onCategoryTap('text'),
                  ),
                ]
                    .animate(interval: 100.ms)
                    .fadeIn()
                    .slideY(begin: 0.2),
              ),

              const SizedBox(height: 32),

              // Nearby devices section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'NEARBY DEVICES',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 2,
                          color: isDark ? AppColors.zinc400 : AppColors.zinc500,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Select a recipient',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: isDark ? AppColors.zinc300 : AppColors.zinc600,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    onPressed: () => deviceProvider.refreshDevices(),
                    icon: Icon(
                      LucideIcons.refreshCw,
                      size: 18,
                      color: deviceProvider.isScanning
                          ? AppColors.violet500
                          : (isDark ? AppColors.zinc400 : AppColors.zinc500),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Device list
              SizedBox(
                height: 130,
                child: deviceProvider.nearbyDevices.isEmpty
                    ? deviceProvider.isScanning
                        ? ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: 3,
                            separatorBuilder: (_, __) => const SizedBox(width: 12),
                            itemBuilder: (_, __) => const DeviceCardShimmer(),
                          )
                        : Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  LucideIcons.wifi,
                                  size: 32,
                                  color: isDark
                                      ? AppColors.zinc700
                                      : AppColors.zinc300,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'No devices found',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: isDark
                                        ? AppColors.zinc500
                                        : AppColors.zinc400,
                                  ),
                                ),
                              ],
                            ),
                          )
                    : ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: deviceProvider.nearbyDevices.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(width: 12),
                        itemBuilder: (context, index) {
                          final device = deviceProvider.nearbyDevices[index];
                          return DeviceCard(
                            device: device,
                            isSelected: _selectedDevice?.id == device.id,
                            onTap: () {
                              setState(() {
                                _selectedDevice = device;
                              });
                              // If there are pending files, send them now
                              if (_pendingFiles != null && _pendingFiles!.isNotEmpty) {
                                _sendFilesToDevice(_pendingFiles!, device);
                              }
                            },
                          );
                        },
                      ),
              ),

              // Selected device info
              if (_selectedDevice != null) ...[
                const SizedBox(height: 24),
                GlassmorphicContainer(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.violet500.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          LucideIcons.send,
                          size: 20,
                          color: AppColors.violet500,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Ready to send to',
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark
                                    ? AppColors.zinc400
                                    : AppColors.zinc500,
                              ),
                            ),
                            Text(
                              _selectedDevice!.name,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.white : AppColors.zinc900,
                              ),
                            ),
                          ],
                        ),
                      ),
                      TextButton(
                        onPressed: () => setState(() => _selectedDevice = null),
                        child: const Text('Cancel'),
                      ),
                    ],
                  ),
                ).animate().fadeIn().slideY(begin: 0.2),
              ],

              const SizedBox(height: 100), // Bottom nav spacing
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String description;
  final Color color;
  final VoidCallback onTap;

  const _CategoryCard({
    required this.icon,
    required this.label,
    required this.description,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: GlassmorphicContainer(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                size: 24,
                color: color,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              label,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.white : AppColors.zinc900,
              ),
            ),
            Text(
              description,
              style: TextStyle(
                fontSize: 11,
                color: isDark ? AppColors.zinc400 : AppColors.zinc500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TextInputSheet extends StatefulWidget {
  @override
  State<_TextInputSheet> createState() => _TextInputSheetState();
}

class _TextInputSheetState extends State<_TextInputSheet> {
  final _controller = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.only(bottom: bottomPadding),
      decoration: BoxDecoration(
        color: isDark ? AppColors.zinc900 : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.zinc700 : AppColors.zinc200,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),

            Text(
              'Send Text',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),

            TextField(
              controller: _controller,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Type your message...',
                hintStyle: TextStyle(
                  color: isDark ? AppColors.zinc500 : AppColors.zinc400,
                ),
              ),
            ),
            const SizedBox(height: 16),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  if (_controller.text.isNotEmpty) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: const Text('Text ready to send'),
                        backgroundColor: AppColors.violet500,
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    );
                  }
                },
                icon: const Icon(LucideIcons.send, size: 18),
                label: const Text('Prepare to Send'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
