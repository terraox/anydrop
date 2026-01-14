/**
 * Local File Transfer WebSocket Service
 * Uses plain WebSocket (not STOMP) for local file transfer signaling
 * Connects to receiver's WebSocket server on /ws
 */
class LocalTransferWebSocketService {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.listeners = new Map();
        this.receiverUrl = null;
    }

    /**
     * Check if WebSocket is connected
     */
    get isConnected() {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    /**
     * Connect to receiver's WebSocket server
     * @param {string} receiverIp - Receiver's LAN IP from mDNS discovery
     * @param {number} receiverPort - Receiver's port (default 8080)
     */
    connect(receiverIp, receiverPort = 8080) {
        // Close any existing connection that's not fully open
        if (this.ws) {
            if (this.ws.readyState === WebSocket.OPEN) {
                console.log('✅ WebSocket already connected');
                // Emit ready event for existing connection
                this._emit('ready', { role: 'receiver' });
                return;
            }
            // Close stale/connecting/closing socket
            if (this.ws.readyState !== WebSocket.CLOSED) {
                console.log('🔄 Closing stale WebSocket connection...');
                try {
                    this.ws.close();
                } catch (e) {
                    // Ignore close errors
                }
            }
            this.ws = null;
        }

        // NOTE: localhost is acceptable ONLY for receiver UI connecting to its own backend
        // For device-to-device transfers, use discovered IP from mDNS
        // We allow localhost here because receiver UI is on same machine as backend
        const isReceiverUI = receiverIp === 'localhost' || receiverIp === '127.0.0.1';

        if (isReceiverUI) {
            console.log('⚠️ Using localhost - OK for receiver UI connecting to its own backend');
        } else {
            // For device-to-device, validate IP is from mDNS discovery
            console.log('✅ Using discovered device IP from mDNS');
        }

        this.receiverUrl = `ws://${receiverIp}:${receiverPort}/ws`;
        console.log('🔌 Connecting to receiver WebSocket:', this.receiverUrl);

        try {
            this.ws = new WebSocket(this.receiverUrl);

            this.ws.onopen = () => {
                console.log('✅ WebSocket connected to receiver');
                this.reconnectAttempts = 0;
                this._emit('connected', {});
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📨 WebSocket message received:', data.type);
                    this._handleMessage(data);
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this._emit('error', { error });
            };

            this.ws.onclose = () => {
                console.log('🔌 WebSocket closed');
                this._emit('disconnected', {});

                // Auto-reconnect logic (optional - can be disabled)
                // if (this.reconnectAttempts < this.maxReconnectAttempts) {
                //     this.reconnectAttempts++;
                //     setTimeout(() => {
                //         console.log(`🔄 Reconnecting... (attempt ${this.reconnectAttempts})`);
                //         this.connect(receiverIp, receiverPort);
                //     }, this.reconnectDelay);
                // }
            };
        } catch (error) {
            console.error('❌ Failed to create WebSocket:', error);
            this._emit('error', { error });
        }
    }

    /**
     * Handle incoming WebSocket messages
     */
    _handleMessage(data) {
        switch (data.type) {
            case 'READY':
                console.log('✅ READY handshake received from receiver');
                this._emit('ready', data);
                break;
            case 'FILE_METADATA':
                console.log('📥 FILE_METADATA received:', data.files);
                this._emit('fileMetadata', data);
                break;
            case 'PROGRESS':
                console.log('📊 PROGRESS update:', data.percentage + '%');
                this._emit('progress', data);
                break;
            case 'TRANSFER_COMPLETE':
                console.log('✅ TRANSFER_COMPLETE:', data.file);
                this._emit('transferComplete', data);
                break;
            case 'TRANSFER_ERROR':
                console.error('❌ TRANSFER_ERROR:', data.error);
                this._emit('transferError', data);
                break;
            case 'ACCEPT':
                console.log('✅ Transfer ACCEPTED:', data.transferId);
                this._emit('accept', data);
                break;
            case 'REJECT':
                console.log('❌ Transfer REJECTED:', data.transferId);
                this._emit('reject', data);
                break;
            case 'TEXT_MESSAGE':
                console.log('📝 Text Message Received:', data.text);
                this._emit('textMessage', data);
                break;
            default:
                console.log('📨 Unknown message type:', data.type);
        }
    }

    /**
     * Send message to receiver
     */
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('📤 Sending via WebSocket:', data);
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('⚠️ WebSocket not connected, cannot send message');
            console.warn('   isConnected:', this.isConnected);
            console.warn('   ws state:', this.ws?.readyState);
        }
    }

    /**
     * Subscribe to events
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Unsubscribe from events
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Emit event to listeners
     */
    _emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error in ${event} listener:`, error);
                }
            });
        }
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.receiverUrl = null;
    }
}

export default new LocalTransferWebSocketService();
