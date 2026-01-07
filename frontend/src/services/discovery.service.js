/**
 * Discovery Service for local network device scanning
 * Scans the local subnet for AnyDrop devices by probing /api/identify
 */

const SCAN_TIMEOUT_MS = 1000;
const BACKEND_PORT = 8080;

class DiscoveryService {
    constructor() {
        this.devices = [];
        this.isScanning = false;
        this.listeners = [];
    }

    /**
     * Add a listener for device updates
     * @param {Function} callback
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Remove a listener
     * @param {Function} callback
     */
    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    /**
     * Notify all listeners of device updates
     */
    _notifyListeners() {
        this.listeners.forEach(cb => cb([...this.devices]));
    }

    /**
     * Probe a single IP to check if it's an AnyDrop device
     * @param {string} ip
     * @returns {Promise<Object|null>}
     */
    async _probeDevice(ip) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);

        try {
            const response = await fetch(`http://${ip}:${BACKEND_PORT}/api/identify`, {
                signal: controller.signal,
                mode: 'cors',
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.app === 'AnyDrop') {
                    return {
                        id: `${ip}:${BACKEND_PORT}`,
                        name: data.name || 'Unknown Device',
                        type: data.type?.toLowerCase() || 'laptop',
                        icon: data.icon || 'laptop',
                        ip: ip,
                        port: BACKEND_PORT,
                        status: 'online',
                        battery: 100, // Default
                    };
                }
            }
        } catch (e) {
            clearTimeout(timeoutId);
            // Ignore errors - device unreachable or not AnyDrop
        }
        return null;
    }

    /**
     * Scan the local subnet for AnyDrop devices
     * Uses common subnet ranges since browser JS can't get local IP
     */
    async scanNetwork() {
        if (this.isScanning) return;

        this.isScanning = true;
        // Don't clear devices immediately to prevent flickering
        // this.devices = []; 
        this._notifyListeners();

        console.log('🔍 Starting network scan...');

        // Detect subnet from current connection if possible
        let subnet = '192.168.1';
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                subnet = hostname.substring(0, hostname.lastIndexOf('.'));
                console.log(`📍 Detected subnet from URL: ${subnet}`);
            }
        }
        const scanPromises = [];
        const foundIds = new Set();

        // Scan IPs 1-254 in batches
        for (let i = 1; i <= 254; i++) {
            const ip = `${subnet}.${i}`;
            scanPromises.push(
                this._probeDevice(ip).then(device => {
                    if (device) {
                        console.log(`✅ Found device: ${device.name} @ ${ip}`);
                        foundIds.add(device.id);

                        // Update existing or add new
                        const existingIndex = this.devices.findIndex(d => d.id === device.id);
                        if (existingIndex >= 0) {
                            this.devices[existingIndex] = device;
                        } else {
                            this.devices.push(device);
                        }
                        this._notifyListeners();
                    }
                })
            );
        }

        await Promise.all(scanPromises);

        this.isScanning = false;
        console.log(`✅ Scan complete. Found ${this.devices.length} device(s).`);
        this._notifyListeners();
    }

    /**
     * Manually add a device by IP
     * @param {string} ip
     */
    async addManualDevice(ip) {
        console.log(`🔍 Probing ${ip}...`);
        const device = await this._probeDevice(ip);
        if (device) {
            // Remove existing if present
            this.devices = this.devices.filter(d => d.ip !== ip);
            this.devices.push(device);
            this._notifyListeners();
            return device;
        }
        return null;
    }

    /**
     * Get current devices
     */
    getDevices() {
        return [...this.devices];
    }
}

// Singleton instance
const discoveryService = new DiscoveryService();

export default discoveryService;
