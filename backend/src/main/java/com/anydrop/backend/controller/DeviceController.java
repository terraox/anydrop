package com.anydrop.backend.controller;

import com.anydrop.backend.model.DeviceInfo;
import com.anydrop.backend.service.DeviceRegistryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Map;

@Controller
public class DeviceController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(DeviceController.class);

    private final DeviceRegistryService deviceRegistryService;

    public DeviceController(DeviceRegistryService deviceRegistryService) {
        this.deviceRegistryService = deviceRegistryService;
    }

    @MessageMapping("/device.register")
    public void registerDevice(@Payload DeviceInfo device, SimpMessageHeaderAccessor headerAccessor,
            Principal principal) {
        if (principal == null)
            return;
        String userId = principal.getName();
        String sessionId = headerAccessor.getSessionId();

        device.setSessionId(sessionId);
        if (headerAccessor.getSessionAttributes() != null) {
            headerAccessor.getSessionAttributes().put("userId", userId);
            headerAccessor.getSessionAttributes().put("deviceId", sessionId);
        }

        deviceRegistryService.registerDevice(userId, device);
    }

    @MessageMapping("/device.update")
    public void updateDevice(@Payload DeviceInfo updatedInfo, SimpMessageHeaderAccessor headerAccessor,
            Principal principal) {
        if (principal == null)
            return;
        String userId = principal.getName();
        String sessionId = headerAccessor.getSessionId();

        updatedInfo.setSessionId(sessionId);
        deviceRegistryService.registerDevice(userId, updatedInfo);
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();

        if (sessionAttributes != null) {
            String userId = (String) sessionAttributes.get("userId");
            String sessionId = (String) sessionAttributes.get("deviceId");

            if (userId != null && sessionId != null) {
                deviceRegistryService.unregisterDevice(userId, sessionId);
            }
        }
    }
}
