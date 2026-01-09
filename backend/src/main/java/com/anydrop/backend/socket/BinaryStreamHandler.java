package com.anydrop.backend.socket;

import com.anydrop.backend.model.User;
import com.anydrop.backend.service.ThrottlingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.AbstractWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
@RequiredArgsConstructor
public class BinaryStreamHandler extends AbstractWebSocketHandler {

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, String> sessionTransferMap = new ConcurrentHashMap<>(); // SessionID -> TransferID
    private final Map<String, WebSocketSession> senders = new ConcurrentHashMap<>(); // TransferID -> Session
    private final Map<String, WebSocketSession> receivers = new ConcurrentHashMap<>(); // TransferID -> Session

    private final ThrottlingService throttlingService;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("Stream Connected: {}", session.getId());
        sessions.put(session.getId(), session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        // Protocol: "ROLE:TRANSFER_ID"
        // e.g. "SENDER:uuid-123" or "RECEIVER:uuid-123"

        String payload = message.getPayload();
        String[] parts = payload.split(":");

        if (parts.length != 2) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        String role = parts[0]; // SENDER or RECEIVER
        String transferId = parts[1];

        sessionTransferMap.put(session.getId(), transferId);

        if ("SENDER".equalsIgnoreCase(role)) {
            senders.put(transferId, session);
            log.info("Registered SENDER for: {}", transferId);
            notifyMatch(transferId);

        } else if ("RECEIVER".equalsIgnoreCase(role)) {
            receivers.put(transferId, session);
            log.info("Registered RECEIVER for: {}", transferId);
            notifyMatch(transferId);
        }
    }

    private void notifyMatch(String transferId) throws IOException {
        WebSocketSession sender = senders.get(transferId);
        WebSocketSession receiver = receivers.get(transferId);

        if (sender != null && sender.isOpen() && receiver != null && receiver.isOpen()) {
            log.info("Match found for {}! Starting stream.", transferId);
            sender.sendMessage(new TextMessage("START"));
            receiver.sendMessage(new TextMessage("START"));
        }
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) throws IOException {
        String transferId = sessionTransferMap.get(session.getId());
        if (transferId == null)
            return;

        // Logic: Forward from Sender -> Receiver
        if (session.equals(senders.get(transferId))) {
            WebSocketSession receiver = receivers.get(transferId);
            if (receiver != null && receiver.isOpen()) {
                // Throttling Logic
                User user = getUser(session);
                io.github.bucket4j.Bucket bucket = throttlingService.resolveBucket(user);
                throttlingService.consume(bucket, message.getPayloadLength());

                // Forward
                receiver.sendMessage(message);
            }
        }
    }

    private User getUser(WebSocketSession session) {
        if (session.getPrincipal() instanceof UsernamePasswordAuthenticationToken) {
            UsernamePasswordAuthenticationToken auth = (UsernamePasswordAuthenticationToken) session.getPrincipal();
            if (auth.getPrincipal() instanceof User) {
                return (User) auth.getPrincipal();
            }
        }
        return null;
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String transferId = sessionTransferMap.remove(session.getId());
        sessions.remove(session.getId());
        if (transferId != null) {
            senders.remove(transferId, session);
            receivers.remove(transferId, session);
        }
    }
}
