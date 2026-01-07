package com.anydrop.backend.controller;

import com.anydrop.backend.model.DeviceInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Controller
@RequiredArgsConstructor
@Slf4j
public class DeviceController {

    private final SimpMessagingTemplate messagingTemplate;

    // Key: UserId, Value: Set of Devices (Thread-safe Set)
    private static final Map<String, Set<DeviceInfo>> activeDevices = new ConcurrentHashMap<>();

    @MessageMapping("/device.register")
    public void registerDevice(@Payload DeviceInfo device, SimpMessageHeaderAccessor headerAccessor,
            Principal principal) {
        if (principal == null)
            return;
        String userId = principal.getName();
        String sessionId = headerAccessor.getSessionId();

        device.setSessionId(sessionId);

        log.info("Registering device: {} for user: {}", device.getName(), userId);

        if (headerAccessor.getSessionAttributes() != null) {
            headerAccessor.getSessionAttributes().put("userId", userId);
            headerAccessor.getSessionAttributes().put("deviceId", sessionId);
        }

        activeDevices.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(device);

        broadcastActiveDevices(userId);
    }

    @MessageMapping("/device.update")
    public void updateDevice(@Payload DeviceInfo updatedInfo, SimpMessageHeaderAccessor headerAccessor,
            Principal principal) {
        if (principal == null)
            return;
        String userId = principal.getName();
        String sessionId = headerAccessor.getSessionId();

        Set<DeviceInfo> devices = activeDevices.get(userId);
        if (devices != null) {
            // Find and update. Since we use Set and equals logic is on sessionId,
            // removing and re-adding ensures fields are updated?
            // Actually, because equals depends on sessionId, the Set thinks it contains it.
            // But the object fields inside might differ.
            // Best is to remove old object with same sessionId and add new one.

            updatedInfo.setSessionId(sessionId); // Ensure session ID matches

            // Remove checks equality (sessionId), so this removes the old entry
            devices.remove(updatedInfo);
            devices.add(updatedInfo);

            log.info("Updated device identity: {} for user: {}", updatedInfo.getName(), userId);
            broadcastActiveDevices(userId);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();

        if (sessionAttributes != null) {
            String userId = (String) sessionAttributes.get("userId");
            String sessionId = (String) sessionAttributes.get("deviceId");

            if (userId != null && sessionId != null) {
                log.info("Device disconnected: {} for user: {}", sessionId, userId);
                Set<DeviceInfo> devices = activeDevices.get(userId);
                if (devices != null) {
                    // Create dummy object for removal by sessionId
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
        }
    }

    private void broadcastActiveDevices(String userId) {
        Set<DeviceInfo> devices = activeDevices.getOrDefault(userId, Collections.emptySet());
        messagingTemplate.convertAndSendToUser(userId, "/queue/devices", devices);
    }
}
