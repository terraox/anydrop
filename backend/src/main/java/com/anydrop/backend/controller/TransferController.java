package com.anydrop.backend.controller;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class TransferController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/transfer.request")
    public void requestTransfer(@Payload TransferRequest request, Principal principal) {
        if (principal == null)
            return;

        log.info("Transfer request from {} to {}: {}", principal.getName(), request.getTargetDeviceId(),
                request.getFilename());

        // Enrich authentication info (Sender Name)
        request.setSender(principal.getName());

        // Send to specific user (or broadcast to all user's devices if targetDeviceId
        // is null/empty)
        // For This "AnyDrop" we treat all logged in devices of the SAME user as the
        // "Orbit"
        // So we broadcast to the user's queue.
        // The sender is the user, so the recipient is ALSO the user (transferring to
        // self/other device).

        // TODO: If we want to support P2P between DIFFERENT users, we need to resolve
        // targetDeviceId to a User.
        // But the prompt implies "Receive on Laptop" (Same User Orbit).

        messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/transfers", request);
    }

    @MessageMapping("/transfer.response")
    public void respondTransfer(@Payload TransferResponse response, Principal principal) {
        if (principal == null)
            return;

        log.info("Transfer response from {} (TransferID: {}): Accepted={}",
                principal.getName(), response.getTransferId(), response.isAccepted());

        // Notify the Sender (which is also the user in this Orbit context)
        messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/transfer.status", response);
    }

    @Data
    @Builder
    public static class TransferRequest {
        private String targetDeviceId; // Optional if broadcasting to all user devices
        private String filename;
        private long size;
        private String fileType;
        private String downloadUrl; // URL to download the file from backend
        private String sender; // Populated by backend
    }

    @Data
    @Builder
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class TransferResponse {
        private String transferId;
        private boolean accepted;
        private String targetDeviceId;
    }
}
