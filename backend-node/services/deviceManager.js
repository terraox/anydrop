import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import { ServerSettings } from '../models/index.js';

/**
 * Device Manager - Manages device identity (name and ID)
 */
class DeviceManager {
  constructor() {
    this.deviceId = null;
    this.deviceName = null;
  }

  /**
   * Initialize device ID (load from DB or create new)
   */
  async initialize() {
    try {
      // Try to load existing device ID
      let deviceIdSetting = await ServerSettings.findOne({ where: { key: 'device_id' } });

      if (!deviceIdSetting) {
        // Generate new UUID
        const newDeviceId = uuidv4();
        deviceIdSetting = await ServerSettings.create({
          key: 'device_id',
          value: newDeviceId
        });
        console.log(`🆔 Generated new device ID: ${newDeviceId}`);
      }

      this.deviceId = deviceIdSetting.value;

      // Load device name
      let deviceNameSetting = await ServerSettings.findOne({ where: { key: 'device_name' } });
      this.deviceName = deviceNameSetting?.value || 'AnyDrop-Desktop';

      console.log(`📱 Device initialized: ${this.deviceName} (${this.deviceId})`);

      return {
        deviceId: this.deviceId,
        deviceName: this.deviceName
      };
    } catch (error) {
      console.error('❌ Error initializing device:', error);
      // Fallback to generated ID if DB fails
      this.deviceId = uuidv4();
      this.deviceName = 'AnyDrop-Desktop';
      return {
        deviceId: this.deviceId,
        deviceName: this.deviceName
      };
    }
  }

  /**
   * Get current device ID
   */
  getDeviceId() {
    return this.deviceId;
  }

  /**
   * Get current device name
   */
  getDeviceName() {
    return this.deviceName;
  }

  /**
   * Update device name
   */
  async updateDeviceName(newName) {
    try {
      this.deviceName = newName;

      // Update in database
      let deviceNameSetting = await ServerSettings.findOne({ where: { key: 'device_name' } });
      if (deviceNameSetting) {
        await deviceNameSetting.update({ value: newName });
      } else {
        await ServerSettings.create({ key: 'device_name', value: newName });
      }

      console.log(`✏️ Device name updated to: ${newName}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating device name:', error);
      return false;
    }
  }

  /**
   * Get device info
   */
  getDeviceInfo() {
    return {
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      ips: this.getDeviceIps()
    };
  }

  /**
   * Get all IPv4 LAN addresses
   */
  getDeviceIps() {
    const interfaces = os.networkInterfaces();
    const ips = [];

    Object.keys(interfaces).forEach((ifname) => {
      interfaces[ifname].forEach((iface) => {
        // Skip internal (non-127.0.0.1) and non-IPv4
        if ('IPv4' !== iface.family || iface.internal !== false) {
          return;
        }
        ips.push(iface.address);
      });
    });

    return ips;
  }
}

// Export singleton instance
const deviceManager = new DeviceManager();
export default deviceManager;
