import { Client } from '@stomp/stompjs';
import api from './api';
import { getBackendWebSocketURL } from '../utils/backendConfig';

class WebSocketService {
    constructor() {
        this.client = null;
        this.subscriptions = {};
        this.connectionState = 'disconnected'; // 'connecting', 'connected', 'disconnected', 'error'
        this.errorListeners = [];
    }

    /**
     * Add a listener for connection state changes
     */
    onConnectionError(callback) {
        this.errorListeners.push(callback);
        return () => {
            this.errorListeners = this.errorListeners.filter(l => l !== callback);
        };
    }

    _notifyError(error) {
        this.errorListeners.forEach(cb => cb(error));
    }

    connect(onConnect) {
        if (this.client && this.client.active) {
            console.log('✅ WebSocket already connected');
            return;
        }

        const token = localStorage.getItem('anydrop_auth_token');
        if (!token) {
            console.warn('⚠️ No auth token found - WebSocket connection skipped');
            this.connectionState = 'error';
            return;
        }

        // Use backend config utility for consistent URL generation
        const wsUrl = getBackendWebSocketURL('/ws');

        console.log('🔌 Connecting to WebSocket:', wsUrl);
        this.connectionState = 'connecting';

        this.client = new Client({
            brokerURL: wsUrl,
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: function (str) {
                // Only log important STOMP messages, not all traffic
                if (str.includes('ERROR') || str.includes('CONNECTED')) {
                    console.log('STOMP:', str);
                }
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: (frame) => {
                console.log('✅ STOMP Connected:', frame);
                this.connectionState = 'connected';
                if (onConnect) onConnect();
            },
            onStompError: (frame) => {
                console.warn('⚠️ STOMP Error:', frame.headers['message']);
                this.connectionState = 'error';
                // Don't spam the console with body details
            },
            onWebSocketError: (event) => {
                // WebSocket errors are common during reconnection attempts
                // Log at warn level to avoid cluttering console
                console.warn('⚠️ WebSocket connection issue - will retry automatically');
                this.connectionState = 'error';
            },
            onDisconnect: () => {
                console.log('🔌 WebSocket disconnected');
                this.connectionState = 'disconnected';
            }
        });

        this.client.activate();
        console.log('⏳ WebSocket activation initiated...');
    }

    subscribe(topic, callback) {
        if (!this.client || !this.client.active) return;

        // Prevent duplicate subs
        if (this.subscriptions[topic]) return;

        this.subscriptions[topic] = this.client.subscribe(topic, (message) => {
            if (message.body) {
                callback(JSON.parse(message.body));
            }
        });
    }

    send(destination, body) {
        if (this.client && this.client.active) {
            this.client.publish({
                destination: destination,
                body: JSON.stringify(body)
            });
        }
    }

    registerDevice(deviceInfo) {
        this.send('/app/device.register', {
            id: deviceInfo.id, // Pass ID if available
            name: deviceInfo.name,
            type: 'DESKTOP',
            model: 'Web Browser',
            deviceIcon: 'laptop'
        });
    }

    sendTransferRequest(targetDeviceId, fileData) {
        this.send('/app/transfer.request', {
            targetDeviceId: targetDeviceId,
            filename: fileData.name,
            size: fileData.sizeBytes, // Ensure backend expects bytes or handle conversion
            fileType: fileData.type,
            downloadUrl: fileData.downloadUrl // Backend needs to know where to fetch from
        });
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
        }
    }
}

export default new WebSocketService();
