/**
 * Local File Transfer Service
 * Handles complete file transfer flow:
 * 1. Connect to receiver WebSocket
 * 2. Send FILE_METADATA
 * 3. Wait for ACCEPT
 * 4. Start HTTP POST upload with progress tracking
 */

import LocalTransferWebSocketService from './localTransferWebSocket.service';

class LocalFileTransferService {
    constructor() {
        this.pendingTransfers = new Map(); // transferId -> { file, targetIp, targetPort, pairingCode, senderDeviceId }
        this.activeUploads = new Map(); // transferId -> { xhr, file }
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
    }

    /**
     * Send file to receiver
     * @param {File} file - File to send
     * @param {string} receiverIp - Receiver's LAN IP from mDNS
     * @param {number} receiverPort - Receiver's port (default 8080)
     * @param {string} senderDeviceId - Sender's device ID
     * @returns {Promise<string>} Transfer ID
     */
    async sendFile(file, receiverIp, receiverPort = 8080, senderDeviceId = 'web-client', transferId = null) {
        if (!transferId) {
            transferId = `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        console.log('📤 Initiating file transfer:', {
            fileName: file.name,
            fileSize: file.size,
            receiverIp,
            receiverPort,
            transferId
        });

        // Step 1: Connect to receiver WebSocket (if not already connected)
        if (!LocalTransferWebSocketService.isConnected) {
            console.log('🔌 Connecting to receiver WebSocket...');
            LocalTransferWebSocketService.connect(receiverIp, receiverPort);

            // Wait for READY handshake
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('WebSocket connection timeout'));
                }, 5000);

                const onReady = () => {
                    clearTimeout(timeout);
                    LocalTransferWebSocketService.off('ready', onReady);
                    resolve();
                };

                LocalTransferWebSocketService.on('ready', onReady);
            });
        }

        // Step 2: Store pending transfer (File object is retained in memory!)
        this.pendingTransfers.set(transferId, {
            file,  // 🚨 IMPORTANT: File object is stored here
            targetIp: receiverIp,
            targetPort: receiverPort,
            senderDeviceId
        });

        // Step 4: Listen for ACCEPT/REJECT before sending metadata to avoid race
        const acceptHandler = (data) => {
            if (data.transferId === transferId) {
                console.log('✅ ACCEPT received, starting HTTP upload...');
                LocalTransferWebSocketService.off('accept', acceptHandler);
                LocalTransferWebSocketService.off('reject', rejectHandler);
                this._startHttpUpload(transferId);
            }
        };

        const rejectHandler = (data) => {
            if (data.transferId === transferId) {
                console.log('❌ REJECT received');
                LocalTransferWebSocketService.off('accept', acceptHandler);
                LocalTransferWebSocketService.off('reject', rejectHandler);
                this.pendingTransfers.delete(transferId);
                if (this.onError) {
                    this.onError(transferId, 'Transfer rejected by receiver');
                }
            }
        };

        LocalTransferWebSocketService.on('accept', acceptHandler);
        LocalTransferWebSocketService.on('reject', rejectHandler);

        // Step 5: Send FILE_METADATA
        const fileMetadata = {
            type: 'FILE_METADATA',
            transferId: transferId,
            files: [{
                name: file.name,
                size: file.size
            }],
            senderId: senderDeviceId,
            senderName: senderDeviceId
        };

        console.log('📤 Sending FILE_METADATA:', fileMetadata);
        LocalTransferWebSocketService.send(fileMetadata);

        return transferId;
    }

    /**
     * Send text message to receiver
     * @param {string} text - Text content
     * @param {string} receiverIp - Receiver's LAN IP
     * @param {number} receiverPort - Receiver's port (default 8080)
     * @param {string} senderDeviceId - Sender's device ID
     */
    async sendText(text, receiverIp, receiverPort = 8080, senderDeviceId = 'web-client') {
        console.log('📤 Sending text:', { text, receiverIp });

        // Connect if needed
        if (!LocalTransferWebSocketService.isConnected) {
            console.log('🔌 Connecting to receiver WebSocket for text...');
            LocalTransferWebSocketService.connect(receiverIp, receiverPort);

            // Wait for READY handshake
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('WebSocket connection timeout'));
                }, 5000);

                const onReady = () => {
                    clearTimeout(timeout);
                    LocalTransferWebSocketService.off('ready', onReady);
                    resolve();
                };

                LocalTransferWebSocketService.on('ready', onReady);
            });
        }

        const message = {
            type: 'TEXT_MESSAGE',
            text: text,
            senderId: senderDeviceId,
            timestamp: Date.now()
        };

        LocalTransferWebSocketService.send(message);
        return true;
    }

    /**
     * Start HTTP POST upload after ACCEPT
     * 
     * ❌ Do NOT use FormData
     * ❌ Do NOT use multipart/form-data
     * ✅ Use application/octet-stream
     * ✅ Use xhr.send(file) directly
     * 
     * @param {string} transferId - Transfer ID
     */
    _startHttpUpload(transferId) {
        const transfer = this.pendingTransfers.get(transferId);
        if (!transfer) {
            console.error('❌ Transfer not found:', transferId);
            return;
        }

        const { file, targetIp, targetPort, senderDeviceId } = transfer;

        // Include transferId in URL query param for easy access on backend
        const uploadUrl = `http://${targetIp}:${targetPort}/upload?transferId=${encodeURIComponent(transferId)}`;

        console.log(`🚀 Starting RAW HTTP upload to ${uploadUrl}`);
        console.log(`   File: ${file.name}, Size: ${file.size} bytes`);

        // 🚨 MANDATORY: Use XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();
        this.activeUploads.set(transferId, { xhr, file });

        // Track upload progress
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const progress = (event.loaded / event.total) * 100;
                console.log(`📊 UPLOAD PROGRESS: ${progress.toFixed(1)}% (${event.loaded}/${event.total} bytes)`);

                if (this.onProgress) {
                    this.onProgress(transferId, progress, event.loaded, event.total);
                }
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                console.log('✅ UPLOAD COMPLETE:', xhr.responseText);
                this.pendingTransfers.delete(transferId);
                this.activeUploads.delete(transferId);

                if (this.onComplete) {
                    this.onComplete(transferId, file.name);
                }
            } else {
                console.error('❌ UPLOAD FAILED:', xhr.status, xhr.statusText, xhr.responseText);
                this.pendingTransfers.delete(transferId);
                this.activeUploads.delete(transferId);

                let errorMessage = xhr.statusText;
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.error) errorMessage = response.error;
                } catch (e) {
                    // Ignore JSON parse error, use statusText
                }

                if (this.onError) {
                    this.onError(transferId, errorMessage);
                }
            }
        };

        xhr.onerror = () => {
            console.error('❌ UPLOAD FAILED (network error)');
            this.pendingTransfers.delete(transferId);
            this.activeUploads.delete(transferId);

            if (this.onError) {
                this.onError(transferId, 'Network error during upload');
            }
        };

        xhr.onabort = () => {
            console.log('⚠️ HTTP upload aborted');
            this.pendingTransfers.delete(transferId);
            this.activeUploads.delete(transferId);
        };

        // Open connection BEFORE setting headers
        xhr.open('POST', uploadUrl, true);

        // 🚨 MANDATORY: Set headers for raw streaming
        xhr.setRequestHeader('X-File-Name', file.name);
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.setRequestHeader('X-Transfer-Id', transferId);
        xhr.setRequestHeader('X-Sender-Device-Id', senderDeviceId);

        // 🚨 MANDATORY: xhr.send(file) - NOT FormData, direct File object
        console.log(`📤 Sending ${file.size} bytes of raw data...`);
        xhr.send(file);
    }

    /**
     * Cancel a transfer
     * @param {string} transferId - Transfer ID
     */
    cancelTransfer(transferId) {
        const upload = this.activeUploads.get(transferId);
        if (upload) {
            upload.xhr.abort();
            this.activeUploads.delete(transferId);
        }
        this.pendingTransfers.delete(transferId);
        console.log('❌ Transfer cancelled:', transferId);
    }
}

export default new LocalFileTransferService();
