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
public class TransferController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(TransferController.class);

    private final SimpMessagingTemplate messagingTemplate;

    public TransferController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

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

    public static class TransferRequest {
        private String targetDeviceId;
        private String filename;
        private long size;
        private String fileType;
        private String downloadUrl;
        private String sender;

        public TransferRequest() {
        }

        public String getTargetDeviceId() {
            return targetDeviceId;
        }

        public void setTargetDeviceId(String targetDeviceId) {
            this.targetDeviceId = targetDeviceId;
        }

        public String getFilename() {
            return filename;
        }

        public void setFilename(String filename) {
            this.filename = filename;
        }

        public long getSize() {
            return size;
        }

        public void setSize(long size) {
            this.size = size;
        }

        public String getFileType() {
            return fileType;
        }

        public void setFileType(String fileType) {
            this.fileType = fileType;
        }

        public String getDownloadUrl() {
            return downloadUrl;
        }

        public void setDownloadUrl(String downloadUrl) {
            this.downloadUrl = downloadUrl;
        }

        public String getSender() {
            return sender;
        }

        public void setSender(String sender) {
            this.sender = sender;
        }
    }

    public static class TransferResponse {
        private String transferId;
        private boolean accepted;
        private String targetDeviceId;

        public TransferResponse() {
        }

        public TransferResponse(String transferId, boolean accepted, String targetDeviceId) {
            this.transferId = transferId;
            this.accepted = accepted;
            this.targetDeviceId = targetDeviceId;
        }

        public String getTransferId() {
            return transferId;
        }

        public void setTransferId(String transferId) {
            this.transferId = transferId;
        }

        public boolean isAccepted() {
            return accepted;
        }

        public void setAccepted(boolean accepted) {
            this.accepted = accepted;
        }

        public String getTargetDeviceId() {
            return targetDeviceId;
        }

        public void setTargetDeviceId(String targetDeviceId) {
            this.targetDeviceId = targetDeviceId;
        }
    }
}
