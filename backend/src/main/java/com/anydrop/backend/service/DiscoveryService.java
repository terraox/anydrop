package com.anydrop.backend.service;

import javax.jmdns.JmDNS;
import javax.jmdns.ServiceInfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.net.InetAddress;
import java.util.HashMap;
import java.util.Map;

/**
 * mDNS/ZeroConf Discovery Service.
 * Broadcasts this device as an AnyDrop service on the local network.
 * Other devices can discover it using the service type "_anydrop._tcp.local."
 */
@Service
public class DiscoveryService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(DiscoveryService.class);

    private JmDNS jmdns;
    private static final String SERVICE_TYPE = "_anydrop._tcp.local.";
    private static final int SERVICE_PORT = 8080;

    // Device identity - configurable via application.properties
    @Value("${app.device.name:AnyDrop-Server}")
    private String deviceName;

    @Value("${app.device.icon:laptop}")
    private String deviceIcon;

    private String deviceVersion = "1.0.0";

    @PostConstruct
    public void registerService() {
        try {
            // Get local IP address - forcing LAN IP to ensure network visibility
            // InetAddress localhost = InetAddress.getLocalHost(); // This often returns
            // 127.0.0.1 on macOS
            InetAddress localhost = InetAddress.getByName("192.168.1.2");
            jmdns = JmDNS.create(localhost);

            // Define service metadata (TXT records)
            Map<String, String> properties = new HashMap<>();
            properties.put("name", deviceName);
            properties.put("icon", deviceIcon);
            properties.put("version", deviceVersion);
            properties.put("type", "DESKTOP");

            // Create and register the mDNS service
            ServiceInfo serviceInfo = ServiceInfo.create(
                    SERVICE_TYPE,
                    deviceName,
                    SERVICE_PORT,
                    0, // weight
                    0, // priority
                    properties);

            jmdns.registerService(serviceInfo);
            log.info("🚀 AnyDrop mDNS Service Registered: {} on {}:{}",
                    deviceName, localhost.getHostAddress(), SERVICE_PORT);

        } catch (IOException e) {
            log.error("❌ Failed to register mDNS service: {}", e.getMessage());
        }
    }

    /**
     * Update device identity and re-register mDNS service
     * Called when user changes device name in Settings
     */
    public void updateDeviceIdentity(String newDeviceName, String newDeviceIcon) {
        if (newDeviceName != null && !newDeviceName.isBlank()) {
            this.deviceName = newDeviceName;
        }
        if (newDeviceIcon != null && !newDeviceIcon.isBlank()) {
            this.deviceIcon = newDeviceIcon;
        }

        // Re-register service with new name
        log.info("♻️ Updating mDNS broadcast with new device name: {}", this.deviceName);
        unregisterService();
        registerService();
    }

    public String getDeviceName() {
        return deviceName;
    }

    public String getDeviceIcon() {
        return deviceIcon;
    }

    @PreDestroy
    public void unregisterService() {
        if (jmdns != null) {
            log.info("🛑 Unregistering mDNS service...");
            jmdns.unregisterAllServices();
            try {
                jmdns.close();
            } catch (IOException e) {
                log.error("Error closing JmDNS: {}", e.getMessage());
            }
        }
    }
}
