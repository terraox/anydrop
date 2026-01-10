import { Bonjour } from 'bonjour-service';
import os from 'os';

const bonjour = new Bonjour();
let service = null;
let currentDeviceName = null;
let currentDeviceId = null;

/**
 * Get internal IP address
 */
const getInternalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '0.0.0.0';
};

/**
 * Start advertising the file drop service on the local network
 * @param {number} port The port the server is listening on (default: 3000)
 * @param {string} deviceName The user-defined device name
 * @param {string} deviceId The persistent unique device ID
 */
export const startAdvertising = (port = 3000, deviceName, deviceId) => {
  // If name or ID changed, stop existing service first
  if (service && (currentDeviceName !== deviceName || currentDeviceId !== deviceId)) {
    stopAdvertising();
  }

  // Store current values
  currentDeviceName = deviceName;
  currentDeviceId = deviceId;

  if (!deviceName || !deviceId) {
    console.warn('⚠️ Cannot advertise: deviceName and deviceId are required');
    return;
  }

  const ip = getInternalIp();
  const hostname = os.hostname();

  // Make service name unique to avoid conflicts (bonjour auto-renames on conflict)
  // Use deviceId suffix to ensure uniqueness while keeping readable name
  const serviceName = `${deviceName}-${deviceId.substring(0, 8)}`;

  // Publish mDNS service with _anydrop._tcp type (matches Flutter app)
  // Explicitly set host to ensure IPv4 address is used
  service = bonjour.publish({
    name: serviceName, // Service name (unique to avoid conflicts)
    type: '_anydrop._tcp',
    port: port,
    host: ip, // Explicitly set host to IPv4 address
    txt: {
      name: deviceName,    // Device name in TXT record (this is what Flutter app reads)
      id: deviceId,        // Persistent device ID
      deviceId: deviceId,  // Alternative key for compatibility
      icon: 'laptop',      // Device icon (laptop for desktop)
      type: 'DESKTOP',     // Device type
      app: 'AnyDrop'       // App identifier
    }
  });

  service.on('up', () => {
    console.log(`📡 mDNS: Advertising "${deviceName}" (${deviceId}) on ${ip}:${port}`);
    console.log(`   Service name: ${serviceName}`);
    console.log(`   Full service: ${serviceName}._anydrop._tcp.local`);
    console.log(`   Host: ${ip}, Port: ${port}`);
  });

  service.on('error', (err) => {
    console.error('❌ mDNS Advertiser Error:', err);
  });

  // Log when service is actually published
  setTimeout(() => {
    if (service && service.published) {
      console.log(`✅ mDNS service published successfully`);
      console.log(`   Published name: ${service.name}`);
    } else {
      console.warn(`⚠️ mDNS service may not be published yet`);
    }
  }, 1000);
};

/**
 * Stop advertising the service
 */
export const stopAdvertising = () => {
  if (service) {
    try {
      service.stop();
      console.log('🛑 mDNS: Stopped advertising');
    } catch (err) {
      console.error('Error stopping mDNS service:', err);
    }
    service = null;
  }
  currentDeviceName = null;
  currentDeviceId = null;
};

/**
 * Update device name (stops and restarts service with new name)
 * @param {number} port The port
 * @param {string} newDeviceName The new device name
 * @param {string} deviceId The device ID (unchanged)
 */
export const updateDeviceName = (port, newDeviceName, deviceId) => {
  console.log(`🔄 mDNS: Updating device name from "${currentDeviceName}" to "${newDeviceName}"`);
  startAdvertising(port, newDeviceName, deviceId);
};

/**
 * Cleanup on shutdown
 */
export const cleanup = () => {
  stopAdvertising();
  bonjour.destroy();
};
