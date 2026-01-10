// Unified Transfer Service - Raw WebSocket connection
// DEPRECATED: For local file transfer, use LocalTransferWebSocketService with /ws path
// This service is kept for legacy features but should not be used for local file transfer

import { getBackendWebSocketURL } from '../utils/backendConfig';
import api from './api';

class TransferService {
    constructor() {
        this.socket = null;
        this.deviceId = null;
        this.isConnected = false;
        this.onTransferRequest = null;
        this.onTransferResponse = null;
        this.onProgress = null;
        this.onError = null;
        this.onTransferComplete = null; // Callback for completed transfers
        this.onUpgradeRequired = null; // Callback when backend signals upgrade requirement
        this.pendingFiles = new Map(); // transferId -> { file, transferId, targetDeviceId }
        this.receivingTransfers = new Map(); // transferId -> { chunks: [], fileName: string, totalSize: number }
        this.activeReceivingTransferId = null; // Tracks the transfer currently receiving binary chunks
        this.queue = [];
        this.isProcessing = false;
        this.CHUNK_SIZE = 64 * 1024; // 64KB chunks for stability
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 2000; // Start with 2 seconds
        this.reconnectTimer = null;
        this.shouldReconnect = true;
    }

    connect(deviceId) {
        // DISABLED: TransferService should not be used for local file transfer
        // The /transfer WebSocket path has been removed
        // Use LocalTransferWebSocketService with /ws path instead
        console.warn('⚠️ TransferService.connect() is disabled for local file transfer');
        console.warn('   Use LocalTransferWebSocketService with /ws path instead');
        console.warn('   TransferService is kept for legacy features only');
        this.deviceId = deviceId;
            this.isConnected = false;
            return;
        
        // DISABLED: All WebSocket connection code below is disabled
        // TransferService should not be used for local file transfer
        // Use LocalTransferWebSocketService with /ws path instead
        /*
        // If already connected, don't reconnect
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log('✅ Transfer socket already connected');
            return;
        }

        // If connecting, wait a bit and check again
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
            console.log('⏳ Transfer socket already connecting, waiting...');
            return;
        }

        // If socket exists but is closed, clean it up first
        if (this.socket && (this.socket.readyState === WebSocket.CLOSED || this.socket.readyState === WebSocket.CLOSING)) {
            console.log('🧹 Cleaning up closed socket before reconnecting...');
            this.socket = null;
        }

        this.deviceId = deviceId;
        console.log('📡 Connecting transfer socket for device:', deviceId);

        // REMOVED: /transfer path - use /ws instead
        // const wsUrl = getBackendWebSocketURL('/transfer');
        const wsUrl = getBackendWebSocketURL('/ws'); // Use /ws instead of /transfer

        console.log('🔌 Transfer WebSocket URL:', wsUrl);

        try {
            this.socket = new WebSocket(wsUrl);
            // Force arraybuffer to keep binary handling consistent across browsers
            this.socket.binaryType = 'arraybuffer';
        } catch (error) {
            console.error('❌ Failed to create WebSocket:', error);
            this.isConnected = false;
            if (this.shouldReconnect && this.deviceId) {
                this.scheduleReconnect();
            }
            return;
        }

        this.socket.onopen = () => {
            console.log('✅ Transfer WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0; // Reset on successful connection
            // Use deviceId as name if available, otherwise fallback to 'Web Client'
            const deviceName = this.deviceId || 'Web Client';
            const regMsg = { type: 'REGISTER', deviceId: this.deviceId, name: deviceName, type: 'DESKTOP' };
            console.log('📤 Sending registration:', regMsg);
            this.send(regMsg);
        };

        this.socket.onmessage = (event) => {
            if (typeof event.data === 'string') {
                this.handleTextMessage(event.data);
            } else if (event.data instanceof Blob) {
                // Binary chunk received
                this.handleBinaryMessage(event.data);
            } else if (event.data instanceof ArrayBuffer) {
                // Convert ArrayBuffer to Blob for consistency
                this.handleBinaryMessage(new Blob([event.data]));
            }
        };

        this.socket.onclose = (event) => {
            console.log('🔌 Transfer WebSocket closed. Code:', event.code, 'Reason:', event.reason);
            this.isConnected = false;

            // Auto-reconnect if not a normal closure and we should reconnect
            if (event.code !== 1000 && this.shouldReconnect && this.deviceId) {
                this.scheduleReconnect();
            }
        };

        this.socket.onerror = (error) => {
            // WebSocket connection errors are common during initial connection
            // or when backend is not ready yet. Log as warning instead of error.
            console.warn('⚠️ Transfer WebSocket error:', error);
            console.warn('⚠️ Socket state:', this.socket?.readyState, 'URL:', wsUrl);
            // Only call onError if we were previously connected (not for initial connection failures)
            // This prevents spamming the user with errors during app startup
            if (this.isConnected && this.onError) {
                this.onError('Connection to transfer server lost');
            }
        };
        */
    }

    handleTextMessage(data) {
        try {
            const message = JSON.parse(data);
            console.log('📩 Transfer message received:', message.type, message);

            switch (message.type) {
                case 'REGISTERED':
                    console.log('✅ Transfer device registered successfully');
                    break;

                case 'TRANSFER_REQUEST':
                    console.log('📥 Incoming transfer request:', message);
                    // Initialize receiving transfer state
                    this.receivingTransfers.set(message.transferId, {
                        chunks: [],
                        fileName: message.fileName,
                        totalSize: message.size || 0,
                        receivedBytes: 0,
                        progress: 0,
                        transferId: message.transferId,
                        senderId: message.senderId,
                        fileHandle: null, // Will be set when user accepts with save dialog
                        isCompleted: false
                    });
                    this.activeReceivingTransferId = message.transferId;
                    // Call callback with properly formatted message
                    console.log('📥 Calling onTransferRequest callback:', !!this.onTransferRequest);
                    if (this.onTransferRequest) {
                        try {
                            this.onTransferRequest({
                                transferId: message.transferId,
                                fileName: message.fileName,
                                size: message.size,
                                senderId: message.senderId,
                                mimeType: message.mimeType
                            });
                            console.log('✅ onTransferRequest callback executed successfully');
                        } catch (error) {
                            console.error('❌ Error in onTransferRequest callback:', error);
                        }
                    } else {
                        console.warn('⚠️ No onTransferRequest callback registered!');
                    }
                    break;

                case 'TRANSFER_RESPONSE': {
                    console.log('📬 Transfer response:', message.status, 'for', message.transferId);
                    const transferData = this.pendingFiles.get(message.transferId);
                    const isReady = message.status === 'READY' || message.status === 'ACCEPTED';

                    if (isReady) {
                        console.log('✅ Transfer ready, starting binary upload');
                        if (transferData) {
                            this.startBinaryUpload(
                                transferData.file,
                                message.transferId,
                                message.targetId || transferData.targetDeviceId,
                                transferData.targetIp,
                                transferData.targetPort
                            );
                        } else {
                            console.error('❌ No pending file found for', message.transferId);
                            this.finishTransfer(message.transferId);
                        }
                    } else {
                        console.log('❌ Transfer rejected:', message.transferId);
                        this.finishTransfer(message.transferId);
                    }
                    if (this.onTransferResponse) this.onTransferResponse(message);
                    break;
                }

                case 'TRANSFER_FINISH':
                    console.log('✅ Received TRANSFER_FINISH for transfer:', message.transferId);
                    this.handleTransferFinish(message.transferId);
                    break;

                case 'ERROR':
                    console.error('❌ Server error:', message.message);
                    if (this.onError) this.onError(message.message);
                    // If error occurs, we might need to clear current processing item
                    if (this.isProcessing && this.queue.length > 0) {
                        this.finishTransfer(this.queue[0].transferId);
                    }
                    break;

                case 'UPGRADE_REQUIRED':
                    console.warn('🚫 Upgrade required message:', message.message);
                    if (this.onUpgradeRequired) this.onUpgradeRequired(message);
                    // Clear current pending file so queue doesn’t hang
                    if (this.isProcessing && this.queue.length > 0) {
                        this.finishTransfer(this.queue[0].transferId);
                    }
                    break;

                default:
                    console.warn('⚠️ Unknown message type:', message.type);
            }
        } catch (e) {
            console.error('❌ Error parsing message:', e, data);
        }
    }

    handleBinaryMessage(data) {
        // Prefer the explicitly tracked active transfer; fall back to the first pending one
        let transferId = this.activeReceivingTransferId || Array.from(this.receivingTransfers.keys())[0];
        let activeTransfer = transferId ? this.receivingTransfers.get(transferId) : null;

        // If we still couldn't find one, bail out early
        if (!activeTransfer) {
            console.warn('⚠️ Received binary chunk but no active receiving transfer');
            return;
        }

        activeTransfer.chunks.push(data);
        activeTransfer.receivedBytes = (activeTransfer.receivedBytes || 0) + data.size;

        // Update progress
        const progress = activeTransfer.totalSize > 0
            ? Math.min(activeTransfer.receivedBytes / activeTransfer.totalSize, 1)
            : 0;

        activeTransfer.progress = progress;

        // Log progress every ~1MB to avoid spam
        if (activeTransfer.receivedBytes % (1024 * 1024) < data.size || progress >= 1) {
            console.log(`📦 Received ${(activeTransfer.receivedBytes / 1024 / 1024).toFixed(2)}MB / ${(activeTransfer.totalSize / 1024 / 1024).toFixed(2)}MB (${(progress * 100).toFixed(1)}%)`);
        }

        // Update progress callback if set
        if (this.onProgress && activeTransfer.transferId) {
            this.onProgress(activeTransfer.transferId, progress);
        }

        // Fallback: if we already received the expected bytes but FINISH hasn't arrived, finalize locally
        if (!activeTransfer.isCompleted && activeTransfer.totalSize > 0 && activeTransfer.receivedBytes >= activeTransfer.totalSize) {
            console.log('🛟 Received all expected bytes, finalizing transfer locally:', transferId);
            this.handleTransferFinish(activeTransfer.transferId);
        }
    }

    async handleTransferFinish(transferId) {
        const receivingTransfer = this.receivingTransfers.get(transferId);

        if (!receivingTransfer) {
            console.warn('⚠️ Received FINISH for unknown transfer:', transferId);
            return;
        }

        if (receivingTransfer.isCompleted) {
            console.log('ℹ️ Transfer already finalized, ignoring duplicate FINISH:', transferId);
            return;
        }
        receivingTransfer.isCompleted = true;

        console.log('✅ Transfer complete! Saving file...');

        try {
            // Create Blob from all collected chunks
            const finalBlob = new Blob(receivingTransfer.chunks);

            // If file handle was provided (from save dialog), use it
            if (receivingTransfer.fileHandle) {
                try {
                    const writable = await receivingTransfer.fileHandle.createWritable();
                    await writable.write(finalBlob);
                    await writable.close();
                    console.log(`✅ File saved to: ${receivingTransfer.fileHandle.name} (${(finalBlob.size / 1024 / 1024).toFixed(2)}MB)`);
                } catch (error) {
                    console.error('❌ Error writing to file handle:', error);
                    // Fall back to download
                    this.downloadFile(finalBlob, receivingTransfer.fileName);
                }
            } else {
                // Use default download
                this.downloadFile(finalBlob, receivingTransfer.fileName);
            }

            // Clear receiving transfer
            this.receivingTransfers.delete(transferId);
            if (this.activeReceivingTransferId === transferId) {
                this.activeReceivingTransferId = null;
            }

            // Notify completion
            if (this.onTransferComplete) {
                this.onTransferComplete(transferId, receivingTransfer.fileName);
            }
        } catch (error) {
            console.error('❌ Error saving file:', error);
            this.receivingTransfers.delete(transferId);
            if (this.onError) {
                this.onError(`Failed to save ${receivingTransfer.fileName}: ${error.message}`);
            }
        }
    }

    downloadFile(blob, fileName) {
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName || 'AnyDrop_File';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    }

    enqueueFile(targetDeviceId, file, transferId, targetIp, targetPort) {
        const id = transferId || crypto.randomUUID();
        console.log('📤 Enqueueing file:', file.name, 'to', targetDeviceId, 'ID:', id, 'IP:', targetIp);
        this.queue.push({ targetDeviceId, file, transferId: id, targetIp, targetPort });

        console.log('📋 Queue length:', this.queue.length, 'Processing:', this.isProcessing);

        // Return ID immediately so UI can show the entry
        if (!this.isProcessing) {
            this.processNext();
        }
        return id;
    }

    async processNext() {
        if (this.queue.length === 0) {
            console.log('✅ Transfer queue empty');
            return;
        }

        if (this.isProcessing) {
            console.log('⏳ Already processing a transfer, waiting...');
            return;
        }

        this.isProcessing = true;

        const next = this.queue[0];
        console.log('🚀 Processing next transfer:', next.file.name, 'to', next.targetDeviceId);

        if (!this.socket || !this.isConnected) {
            console.error('❌ Not connected to transfer endpoint');
            if (this.onError) this.onError('Not connected to transfer server');
            this.finishTransfer(next.transferId);
            return;
        }

        this.pendingFiles.set(next.transferId, next);

        const request = {
            type: 'TRANSFER_REQUEST',
            targetId: next.targetDeviceId,
            senderId: this.deviceId,
            transferId: next.transferId,
            fileName: next.file.name,
            size: next.file.size,
            targetIp: next.targetIp,
            targetPort: next.targetPort
        };

        console.log('📤 Sending transfer request:', request);
        this.send(request);
    }

    finishTransfer(transferId) {
        console.log('✓ Finishing transfer:', transferId);
        this.pendingFiles.delete(transferId);
        // Remove from queue
        this.queue = this.queue.filter(item => item.transferId !== transferId);
        this.isProcessing = false;
        console.log('📋 Remaining in queue:', this.queue.length);
        // Move to next
        this.processNext();
    }

    async startBinaryUpload(file, transferId, targetId, targetIp, targetPort) {
        console.log(`🚀 Starting HTTP streaming upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB), ID: ${transferId}`);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('transferId', transferId);
            formData.append('targetId', targetId);

            // Use direct IP if provided, otherwise use backend base URL
            const uploadUrl = targetIp
                ? `http://${targetIp}:${targetPort || 8080}/api/files/transfer`
                : '/files/transfer';

            console.log(`📤 Uploading to: ${uploadUrl}`);

            // Use axios (this.api if we can inject it, or import api)
            const response = await api.post(uploadUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.loaded / progressEvent.total;
                    console.log(`📊 Upload progress: ${(progress * 100).toFixed(1)}%`);
                    if (this.onProgress) {
                        this.onProgress(transferId, progress);
                    }
                },
                // Use a longer timeout for large file transfers
                timeout: 0,
            });

            console.log('✅ HTTP Upload complete!', response.data);

            // Send FINISH signal via WebSocket (signalling only)
            const finishMessage = {
                type: 'TRANSFER_FINISH',
                targetId: targetId,
                transferId: transferId
            };

            this.send(finishMessage);
            console.log('✅ FINISH signal sent via WebSocket');

            // Complete the transfer
            this.finishTransfer(transferId);
        } catch (error) {
            console.error('❌ HTTP streaming upload failed:', error);
            if (this.onError) {
                this.onError(`Upload failed for ${file.name}: ${error.message}`);
            }
            this.finishTransfer(transferId);
        }
    }

    // Accept an incoming transfer request
    acceptTransfer(transferId, senderId, fileHandle = null) {
        console.log('✅ Accepting transfer:', transferId);

        // Store file handle if provided
        if (fileHandle) {
            const receivingTransfer = this.receivingTransfers.get(transferId);
            if (receivingTransfer) {
                receivingTransfer.fileHandle = fileHandle;
            }
        }

        this.send({
            type: 'TRANSFER_RESPONSE',
            targetId: senderId,
            transferId: transferId,
            status: 'READY' // signal that receiver is ready to stream
        });
    }

    // Reject an incoming transfer request
    rejectTransfer(transferId, senderId) {
        console.log('❌ Rejecting transfer:', transferId);
        this.send({
            type: 'TRANSFER_RESPONSE',
            targetId: senderId,
            transferId: transferId,
            status: 'REJECTED'
        });
        // Clean up receiving transfer state
        this.receivingTransfers.delete(transferId);
    }

    send(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.error('❌ Cannot send - socket not ready. State:', this.socket?.readyState);
        }
    }

    scheduleReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnect attempts reached. Please check if backend is running on port 8080.');
            if (this.onError) {
                this.onError('Cannot connect to transfer server. Is the backend running?');
            }
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 30000); // Max 30s

        console.log(`🔄 Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        this.reconnectTimer = setTimeout(() => {
            if (this.shouldReconnect && this.deviceId) {
                console.log('🔄 Attempting to reconnect...');
                this.connect(this.deviceId);
            }
        }, delay);
    }

    disconnect() {
        console.log('🔌 Disconnecting transfer service');
        this.shouldReconnect = false;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.socket) {
            this.socket.close(1000, 'Client disconnect');
        }
        this.isConnected = false;
        this.queue = [];
        this.isProcessing = false;
        this.pendingFiles.clear();
        this.reconnectAttempts = 0;
    }
}

// Singleton export
const transferService = new TransferService();
export default transferService;
