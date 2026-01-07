import { Client } from '@stomp/stompjs';
import api from './api';

class WebSocketService {
    constructor() {
        this.client = null;
        this.subscriptions = {};
    }

    connect(onConnect) {
        if (this.client && this.client.active) return;

        const token = localStorage.getItem('anydrop_auth_token');
        if (!token) return;

        // Robust URL generation
        const baseUrl = api.defaults?.baseURL || 'http://localhost:8080/api';
        const wsUrl = baseUrl.replace('http', 'ws').replace('/api', '/ws-anydrop');

        this.client = new Client({
            brokerURL: wsUrl,
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: function (str) {
                console.log(str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: (frame) => {
                console.log('Connected: ' + frame);
                if (onConnect) onConnect();
            },
            onStompError: (frame) => {
                console.log('Broker reported error: ' + frame.headers['message']);
                console.log('Additional details: ' + frame.body);
            }
        });

        // Fallback if brokerURL doesn't work (requires SockJS on backend, which we might not have enabled)
        // this.client.webSocketFactory = () => new SockJS('http://localhost:8080/ws-anydrop');

        this.client.activate();
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
            name: deviceInfo.name,
            type: 'DESKTOP',
            model: 'Web Browser',
            deviceIcon: 'laptop'
        });
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
        }
    }
}

export default new WebSocketService();
