package com.anydrop.backend.service;

import com.anydrop.backend.model.DeviceInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DeviceRegistryService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(DeviceRegistryService.class);

    private final SimpMessagingTemplate messagingTemplate;

    public DeviceRegistryService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // UserId -> Set of Devices
    private final Map<String, Set<DeviceInfo>> activeDevices = new ConcurrentHashMap<>();

    public void registerDevice(String userId, DeviceInfo device) {
        log.info("Registering device: {} for user: {} via generic registry", device.getName(), userId);
        activeDevices.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(device);
        broadcastActiveDevices(userId);
    }

    public void unregisterDevice(String userId, String sessionId) {
        Set<DeviceInfo> devices = activeDevices.get(userId);
        if (devices != null) {
            DeviceInfo dummy = new DeviceInfo();
            dummy.setSessionId(sessionId);
            devices.remove(dummy);

            if (devices.isEmpty()) {
                activeDevices.remove(userId);
            } else {
                broadcastActiveDevices(userId);
            }
        }
    }

    private void broadcastActiveDevices(String userId) {
        Set<DeviceInfo> devices = activeDevices.getOrDefault(userId, Collections.emptySet());
        messagingTemplate.convertAndSendToUser(userId, "/queue/devices", devices);
    }
}
