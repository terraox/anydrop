// Unified Transfer Service - Raw WebSocket connection to /transfer endpoint
// This matches the mobile app's TransferService.dart protocol

import { getBackendWebSocketURL } from '../utils/backendConfig';

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
        this.pendingFiles = new Map(); // transferId -> { file, transferId, targetDeviceId }
        this.receivingTransfers = new Map(); // transferId -> { chunks: [], fileName: string, totalSize: number }
        this.queue = [];
        this.isProcessing = false;
        this.CHUNK_SIZE = 64 * 1024; // 64KB chunks for stability
    }

    connect(deviceId) {
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            console.log('✅ Transfer socket already connected/connecting');
            return;
        }

        this.deviceId = deviceId;
        console.log('📡 Connecting transfer socket for device:', deviceId);

        // Use backend config utility for consistent URL generation
        const wsUrl = getBackendWebSocketURL('/transfer');

        console.log('🔌 Transfer WebSocket URL:', wsUrl);

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log('✅ Transfer WebSocket connected');
            this.isConnected = true;
            const regMsg = { type: 'REGISTER', deviceId: this.deviceId, name: 'Web Client' };
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
        };

        this.socket.onerror = (error) => {
            // WebSocket connection errors are common during initial connection
            // or when backend is not ready yet. Log as warning instead of error.
            console.warn('⚠️ Transfer WebSocket error - will retry on reconnection');
            // Only call onError if we were previously connected (not for initial connection failures)
            // This prevents spamming the user with errors during app startup
            if (this.isConnected && this.onError) {
                this.onError('Connection to transfer server lost');
            }
        };
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
                        fileHandle: null // Will be set when user accepts with save dialog
                    });
                    if (this.onTransferRequest) this.onTransferRequest(message);
                    break;

                case 'TRANSFER_RESPONSE':
                    console.log('📬 Transfer response:', message.status, 'for', message.transferId);
                    const transferData = this.pendingFiles.get(message.transferId);
                    if (message.status === 'ACCEPTED') {
                        console.log('✅ Transfer accepted, starting binary upload');
                        if (transferData) {
                            this.startBinaryUpload(transferData.file, message.transferId, message.targetId);
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

                default:
                    console.warn('⚠️ Unknown message type:', message.type);
            }
        } catch (e) {
            console.error('❌ Error parsing message:', e, data);
        }
    }

    handleBinaryMessage(data) {
        // Find the active receiving transfer
        // Note: In a proper implementation, we'd track which transfer is active
        // For now, if we have only one receiving transfer, use it
        const activeTransfer = Array.from(this.receivingTransfers.values())[0];

        if (activeTransfer) {
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
        } else {
            console.warn('⚠️ Received binary chunk but no active receiving transfer');
        }
    }

    async handleTransferFinish(transferId) {
        const receivingTransfer = this.receivingTransfers.get(transferId);

        if (!receivingTransfer) {
            console.warn('⚠️ Received FINISH for unknown transfer:', transferId);
            return;
        }

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

    // New entry point for sending files
    enqueueFile(targetDeviceId, file, transferId) {
        const id = transferId || crypto.randomUUID();
        console.log('📤 Enqueueing file:', file.name, 'to', targetDeviceId, 'ID:', id);
        this.queue.push({ targetDeviceId, file, transferId: id });

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
            size: next.file.size
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

    async startBinaryUpload(file, transferId, targetId) {
        if (!this.socket || !this.isConnected) {
            console.error('❌ Cannot start upload - not connected');
            return;
        }

        console.log(`🚀 Starting binary upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) in ${this.CHUNK_SIZE / 1024}KB chunks, ID: ${transferId}`);

        let offset = 0;
        let chunkCount = 0;
        const totalSize = file.size;

        try {
            while (offset < file.size) {
                const chunkEnd = Math.min(offset + this.CHUNK_SIZE, file.size);
                const chunk = file.slice(offset, chunkEnd);
                const buffer = await chunk.arrayBuffer();

                if (this.socket.readyState !== WebSocket.OPEN) {
                    console.error('❌ Socket closed during upload');
                    break;
                }

                this.socket.send(buffer);
                offset = chunkEnd;
                chunkCount++;

                const progress = Math.min(offset / totalSize, 1);

                // Log progress every ~10 chunks or at completion
                if (chunkCount % 10 === 0 || progress >= 1) {
                    console.log(`📊 Upload progress: ${(progress * 100).toFixed(1)}% (${(offset / 1024 / 1024).toFixed(2)}MB / ${(totalSize / 1024 / 1024).toFixed(2)}MB, ${chunkCount} chunks)`);
                }

                if (this.onProgress) {
                    this.onProgress(transferId, progress);
                }

                // Small delay to allow UI updates and prevent overwhelming the socket
                await new Promise(resolve => setTimeout(resolve, 1));
            }

            // Send FINISH signal after all binary data is sent
            console.log(`✅ Binary upload complete! Total chunks: ${chunkCount}. Sending FINISH signal...`);

            const finishMessage = {
                type: 'TRANSFER_FINISH',
                targetId: targetId,
                transferId: transferId
            };

            this.send(finishMessage);
            console.log('✅ FINISH signal sent');

            // Complete the transfer
            this.finishTransfer(transferId);
        } catch (error) {
            console.error('❌ Binary upload failed:', error);
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
            status: 'ACCEPTED'
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

    disconnect() {
        console.log('🔌 Disconnecting transfer service');
        if (this.socket) {
            this.socket.close();
        }
        this.isConnected = false;
        this.queue = [];
        this.isProcessing = false;
        this.pendingFiles.clear();
    }
}

// Singleton export
const transferService = new TransferService();
export default transferService;
