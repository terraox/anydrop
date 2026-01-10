import { Bonjour } from 'bonjour-service';
import { EventEmitter } from 'events';

const bonjour = new Bonjour();
let browser = null;
const discoveredDevices = new Map(); // deviceId -> device info

/**
 * mDNS Browser - Discovers devices on the local network
 * Emits events for device discovery, updates, and removal
 */
class MDNSBrowser extends EventEmitter {
  constructor() {
    super();
    this.isBrowsing = false;
  }

  /**
   * Start browsing for _anydrop._tcp services
   */
  startBrowsing() {
    if (this.isBrowsing) {
      console.log('⚠️ mDNS Browser: Already browsing');
      return;
    }

    this.isBrowsing = true;
    console.log('🔍 mDNS Browser: Starting discovery...');

    browser = bonjour.find({ type: '_anydrop._tcp' });

    browser.on('up', (service) => {
      this.handleServiceUp(service);
    });

    browser.on('down', (service) => {
      this.handleServiceDown(service);
    });

    browser.on('update', (service) => {
      this.handleServiceUpdate(service);
    });
  }

  /**
   * Handle service discovery
   */
  handleServiceUp(service) {
    const deviceId = service.txt?.id;
    const deviceName = service.txt?.name || service.name;
    const addresses = service.addresses || [];
    const ip = addresses.length > 0 ? addresses[0] : null;

    if (!deviceId) {
      console.warn('⚠️ mDNS Browser: Service missing deviceId:', service.name);
      return;
    }

    const deviceInfo = {
      deviceId: deviceId,
      deviceName: deviceName,
      ip: ip,
      port: service.port,
      lastSeen: new Date(),
      hostname: service.host
    };

    discoveredDevices.set(deviceId, deviceInfo);

    console.log(`✅ mDNS Browser: Discovered "${deviceName}" (${deviceId}) at ${ip}:${service.port}`);

    this.emit('deviceDiscovered', deviceInfo);
    this.emit('devicesUpdated', this.getDevicesList());
  }

  /**
   * Handle service removal
   */
  handleServiceDown(service) {
    const deviceId = service.txt?.id;
    if (!deviceId) return;

    const device = discoveredDevices.get(deviceId);
    if (device) {
      discoveredDevices.delete(deviceId);
      console.log(`❌ mDNS Browser: Device removed "${device.deviceName}" (${deviceId})`);

      this.emit('deviceRemoved', device);
      this.emit('devicesUpdated', this.getDevicesList());
    }
  }

  /**
   * Handle service update (e.g., name change)
   */
  handleServiceUpdate(service) {
    const deviceId = service.txt?.id;
    if (!deviceId) return;

    const existingDevice = discoveredDevices.get(deviceId);
    if (existingDevice) {
      const newDeviceName = service.txt?.name || service.name;
      const addresses = service.addresses || [];
      const ip = addresses.length > 0 ? addresses[0] : null;

      const updatedDevice = {
        ...existingDevice,
        deviceName: newDeviceName,
        ip: ip || existingDevice.ip,
        port: service.port || existingDevice.port,
        lastSeen: new Date()
      };

      discoveredDevices.set(deviceId, updatedDevice);

      console.log(`🔄 mDNS Browser: Device updated "${newDeviceName}" (${deviceId})`);

      this.emit('deviceUpdated', updatedDevice);
      this.emit('devicesUpdated', this.getDevicesList());
    } else {
      // If not in map, treat as new discovery
      this.handleServiceUp(service);
    }
  }

  /**
   * Get current list of discovered devices
   * @returns {Array} List of device objects
   */
  getDevicesList() {
    return Array.from(discoveredDevices.values());
  }

  /**
   * Get a specific device by ID
   * @param {string} deviceId
   * @returns {Object|null}
   */
  getDevice(deviceId) {
    return discoveredDevices.get(deviceId) || null;
  }

  /**
   * Stop browsing
   */
  stopBrowsing() {
    if (browser) {
      browser.stop();
      browser = null;
    }
    this.isBrowsing = false;
    discoveredDevices.clear();
    console.log('🛑 mDNS Browser: Stopped browsing');
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.stopBrowsing();
    bonjour.destroy();
  }
}

// Export singleton instance
const mdnsBrowser = new MDNSBrowser();
export default mdnsBrowser;
