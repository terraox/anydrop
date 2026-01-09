package com.anydrop.backend.socket;

import com.anydrop.backend.service.DeviceRegistryService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.AbstractWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
@RequiredArgsConstructor
public class AnyDropHandler extends AbstractWebSocketHandler {

    // DeviceID -> WebSocketSession
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    // SessionID -> DeviceID (for reverse lookup on close)
    private final Map<String, String> sessionToDevice = new ConcurrentHashMap<>();

    private final DeviceRegistryService deviceRegistryService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("📡 Transfer connection established: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        try {
            JsonNode json = objectMapper.readTree(message.getPayload());
            String type = json.has("type") ? json.get("type").asText() : "";

            switch (type) {
                case "REGISTER":
                    handleRegister(session, json);
                    break;
                case "TRANSFER_REQUEST":
                case "TRANSFER_RESPONSE":
                case "TRANSFER_FINISH":
                    handleHandshake(session, json);
                    break;
                default:
                    log.warn("Unknown message type: {}", type);
            }
        } catch (Exception e) {
            log.error("Error parsing text message: {}", e.getMessage());
        }
    }

    private void handleRegister(WebSocketSession session, JsonNode json) {
        String deviceId = json.get("deviceId").asText();
        String name = json.has("name") ? json.get("name").asText() : "Unknown Device";

        sessions.put(deviceId, session);
        sessionToDevice.put(session.getId(), deviceId);
        log.info("✅ Registered device on transfer WS: {} (name: {}, sessionId: {})", deviceId, name, session.getId());

        // Also register in the central discovery registry
        // If we don't have a principal, we can't easily group by user and remain
        // private
        // However, for this implementation, we'll try to get it from the session
        java.security.Principal principal = session.getPrincipal(); // Re-added definition
        // Fallback to default admin for unauthenticated devices (Phone) to ensure
        // discovery works
        String userId = principal != null ? principal.getName() : "admin@anydrop.com";
        log.info("📋 Registering device in central registry for user: {}", userId);

        deviceRegistryService.registerDevice(userId, com.anydrop.backend.model.DeviceInfo.builder()
                .id(deviceId)
                .sessionId(session.getId())
                .name(name)
                .type(json.has("type") && !json.get("type").asText().equals("REGISTER") ? json.get("type").asText()
                        : "PHONE")
                .batteryLevel(100)
                .build());

        // Send acknowledgment
        try {
            session.sendMessage(new TextMessage("{\"type\":\"REGISTERED\",\"status\":\"OK\"}"));
            log.info("📤 Sent registration ACK to {}", deviceId);
        } catch (IOException e) {
            log.error("❌ Failed to send registration ack: {}", e.getMessage());
        }
    }

    private void handleHandshake(WebSocketSession session, JsonNode json) throws IOException {
        String targetId = json.has("targetId") ? json.get("targetId").asText() : null;
        String transferId = json.has("transferId") ? json.get("transferId").asText() : "unknown";
        String type = json.get("type").asText();

        log.info("📨 Handshake message: {} for transfer: {} to target: {}", type, transferId, targetId);

        if (targetId == null) {
            log.warn("⚠️ Missing targetId in handshake message");
            return;
        }

        WebSocketSession targetSession = sessions.get(targetId);

        if (targetSession != null && targetSession.isOpen()) {
            // Store current target in session attributes for binary routing
            session.getAttributes().put("currentTarget", targetId);
            log.info("🎯 Set current target for session {} to {}", session.getId(), targetId);

            // Forward the JSON message to the target device
            targetSession.sendMessage(new TextMessage(json.toString()));
            log.info("📤 Forwarded {} to {} (transfer: {})", type, targetId, transferId);
        } else {
            log.warn("❌ Target device {} not found or disconnected (available: {})", targetId, sessions.keySet());
            // Notify sender that target is offline
            session.sendMessage(new TextMessage("{\"type\":\"ERROR\",\"message\":\"Target device offline\"}"));
        }
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) throws IOException {
        // Get the target from session attributes (set during handshake)
        String targetId = (String) session.getAttributes().get("currentTarget");

        if (targetId == null) {
            log.warn("⚠️ No target set for binary message from session: {}", session.getId());
            return;
        }

        WebSocketSession targetSession = sessions.get(targetId);

        if (targetSession != null && targetSession.isOpen()) {
            int chunkSize = message.getPayloadLength();
            targetSession.sendMessage(new BinaryMessage(message.getPayload()));

            // Log every 100th chunk to avoid spam (assuming 512KB chunks)
            if (Math.random() < 0.01) { // 1% sample rate
                log.debug("📦 Forwarded binary chunk ({} bytes) from {} to {}", chunkSize, session.getId(), targetId);
            }
        } else {
            log.warn("❌ Target session {} closed during transfer", targetId);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String deviceId = sessionToDevice.remove(session.getId());
        if (deviceId != null) {
            sessions.remove(deviceId);
            log.info("🔌 Device disconnected: {} (status: {})", deviceId, status);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("Transport error for session {}: {}", session.getId(), exception.getMessage());
    }
}
