import { Bonjour } from 'bonjour-service';
import os from 'os';

const bonjour = new Bonjour();
let service = null;
let restartTimeout = null;

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
 * Start advertising the AnyDrop service on the local network
 * @param {number} port The port the server is listening on
 * @param {string} name The name of the device
 */
export const startAdvertising = (port, name) => {
  // Clear any pending restart
  if (restartTimeout) {
    clearTimeout(restartTimeout);
    restartTimeout = null;
  }

  // Stop existing service if running
  if (service) {
    try {
      service.stop();
      // Wait a bit for the service to fully stop before starting a new one
      // This ensures clean restart and proper mDNS propagation
      restartTimeout = setTimeout(() => {
        _publishService(port, name);
        restartTimeout = null;
      }, 100);
    } catch (e) {
      console.error('Error stopping service:', e);
      // Continue to publish even if stop failed
      _publishService(port, name);
    }
  } else {
    _publishService(port, name);
  }
};

/**
 * Internal function to publish the service
 */
const _publishService = (port, name) => {
  const hostname = os.hostname();
  const ip = getInternalIp();

  service = bonjour.publish({
    name: name || `AnyDrop-${hostname}`,
    type: 'anydrop',
    protocol: 'tcp',
    port: port,
    txt: {
      app: 'AnyDrop',
      version: '1.0.0',
      type: 'DESKTOP',
      name: name || hostname,
      ip: ip,
      id: name || hostname
    }
  });

  service.on('up', () => {
    console.log(`📡 Bonjour: Advertising "${service.name}" on ${ip}:${port}`);
  });

  service.on('error', (err) => {
    console.error('❌ Bonjour Error:', err);
  });
};

/**
 * Stop advertising
 */
export const stopAdvertising = () => {
  if (service) {
    service.stop();
    service = null;
    console.log('🛑 Bonjour: Stopped advertising');
  }
};

/**
 * Find other AnyDrop peers on the network
 * @returns {Promise<Array>} List of discovered peers
 */
export const findPeers = () => {
  return new Promise((resolve) => {
    const peers = [];
    const browser = bonjour.find({ type: 'anydrop', protocol: 'tcp' });

    browser.on('up', (service) => {
      console.log('🔍 Bonjour: Found peer:', service.name, service.addresses);
      peers.push({
        name: service.name,
        addresses: service.addresses,
        port: service.port,
        txt: service.txt
      });
    });

    // Scan for 3 seconds
    setTimeout(() => {
      browser.stop();
      resolve(peers);
    }, 3000);
  });
};
