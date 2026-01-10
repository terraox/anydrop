import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/local_file_transfer_service.dart';
import '../providers/device_provider.dart';

/// Widget to test connectivity to the local file transfer server
class ConnectivityTestWidget extends StatefulWidget {
  const ConnectivityTestWidget({super.key});

  @override
  State<ConnectivityTestWidget> createState() => _ConnectivityTestWidgetState();
}

class _ConnectivityTestWidgetState extends State<ConnectivityTestWidget> {
  final _service = LocalFileTransferService();
  bool _isConnected = false;
  bool _isTesting = false;
  Map<String, dynamic>? _deviceInfo;
  List<Map<String, dynamic>> _devices = [];

  @override
  void initState() {
    super.initState();
    _testConnection();
  }

  Future<void> _testConnection() async {
    setState(() {
      _isTesting = true;
    });

    // Get discovered devices from DeviceProvider (mDNS discovery)
    final deviceProvider = Provider.of<DeviceProvider>(context, listen: false);
    final discoveredDevices = deviceProvider.nearbyDevices;
    
    // Test connection to first discovered device (or use a specific one)
    if (discoveredDevices.isEmpty) {
      setState(() {
        _isConnected = false;
        _deviceInfo = null;
        _devices = [];
        _isTesting = false;
      });
      return;
    }
    
    // Use the first discovered device's IP and port
    final testDevice = discoveredDevices.first;
    final testIp = testDevice.ip;
    final testPort = testDevice.port ?? 8080;
    
    if (testIp == null) {
      setState(() {
        _isConnected = false;
        _deviceInfo = null;
        _devices = [];
        _isTesting = false;
      });
      return;
    }
    
    final connected = await _service.testConnection(testIp, testPort);
    Map<String, dynamic>? deviceInfo;
    List<Map<String, dynamic>> devices = [];

    if (connected) {
      deviceInfo = await _service.getDeviceInfo(testIp, testPort);
      devices = await _service.getDiscoveredDevices(testIp, testPort);
    }

    setState(() {
      _isConnected = connected;
      _deviceInfo = deviceInfo;
      _devices = devices;
      _isTesting = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Icon(
                  _isConnected ? Icons.check_circle : Icons.error,
                  color: _isConnected ? Colors.green : Colors.red,
                ),
                const SizedBox(width: 8),
                Text(
                  _isConnected ? 'Connected' : 'Not Connected',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: _isConnected ? Colors.green : Colors.red,
                  ),
                ),
                const Spacer(),
                if (_isTesting)
                  const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                else
                  IconButton(
                    icon: const Icon(Icons.refresh),
                    onPressed: _testConnection,
                  ),
              ],
            ),
            const SizedBox(height: 16),
            if (_isConnected && _deviceInfo != null) ...[
              Builder(
                builder: (context) {
                  final deviceProvider = Provider.of<DeviceProvider>(context, listen: false);
                  final devices = deviceProvider.nearbyDevices;
                  if (devices.isNotEmpty && devices.first.ip != null) {
                    final ip = devices.first.ip!;
                    final port = devices.first.port ?? 8080;
                    return Text(
                      'Server: http://$ip:$port',
                      style: Theme.of(context).textTheme.bodySmall,
                    );
                  }
                  return Text(
                    'Server: Connected',
                    style: Theme.of(context).textTheme.bodySmall,
                  );
                },
              ),
              const SizedBox(height: 8),
              Text('Device Name: ${_deviceInfo!['deviceName']}'),
              Text('Device ID: ${_deviceInfo!['deviceId']}'),
              const SizedBox(height: 16),
              Text(
                'Discovered Devices (${_devices.length}):',
                style: Theme.of(context).textTheme.titleSmall,
              ),
              if (_devices.isEmpty)
                const Text('No devices found on network')
              else
                ..._devices.map((device) => Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        '• ${device['deviceName']} (${device['ip']}:${device['port']})',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    )),
            ] else if (!_isTesting) ...[
              const Text('Cannot connect to local file transfer server.'),
              const SizedBox(height: 8),
              const Text(
                'Make sure:\n'
                '1. Server is running: npm run local-transfer\n'
                '2. Phone and computer are on same Wi-Fi\n'
                '3. Device is discovered via mDNS (check device list)',
                style: TextStyle(fontSize: 12),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
