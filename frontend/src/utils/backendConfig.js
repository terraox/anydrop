/**
 * Backend Configuration Utility
 * Provides consistent backend URL and port configuration
 */

/**
 * Get the backend port from environment variable or localStorage
 * @returns {string} Backend port (default: '8080')
 */
export const getBackendPort = () => {
    return import.meta.env.VITE_BACKEND_PORT ||
        localStorage.getItem('anydrop_backend_port') ||
        '8080';
};

/**
 * Get the backend base URL
 * @returns {string} Backend base URL (e.g., 'http://localhost:8080/api')
 */
export const getBackendBaseURL = () => {
    // Highest priority: explicit URL override
    if (import.meta.env.VITE_BACKEND_URL) {
        return import.meta.env.VITE_BACKEND_URL;
    }
    if (typeof window === 'undefined') {
        return 'http://localhost:8080/api';
    }

    const port = getBackendPort();
    // Always use localhost for backend - backend runs on same machine
    // This fixes ERR_ADDRESS_UNREACHABLE when accessing frontend via IP
    const hostname = 'localhost';
    const protocol = window.location.protocol;

    return `${protocol}//${hostname}:${port}/api`;
};

/**
 * Get the backend WebSocket URL
 * @param {string} path - WebSocket path (e.g., '/ws')
 * @returns {string} WebSocket URL
 * 
 * IMPORTANT: Use only /ws path. The /transfer path has been removed.
 */
export const getBackendWebSocketURL = (path) => {
    // Validate path is not /transfer
    if (path === '/transfer' || path.includes('/transfer')) {
        console.error('❌ ERROR: /transfer WebSocket path is removed. Use /ws instead.');
        path = '/ws'; // Fallback to /ws
    }
    
    // Highest priority: explicit WS URL override
    if (import.meta.env.VITE_BACKEND_WS_URL) {
        return `${import.meta.env.VITE_BACKEND_WS_URL}${path}`;
    }
    if (typeof window === 'undefined') {
        return `ws://localhost:8080${path}`;
    }

    const port = getBackendPort();
    // Always use localhost for backend - backend runs on same machine
    // This fixes ERR_ADDRESS_UNREACHABLE when accessing frontend via IP
    const hostname = 'localhost';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    return `${protocol}//${hostname}:${port}${path}`;
};

/**
 * Set the backend port (saves to localStorage)
 * @param {string} port - Backend port
 */
export const setBackendPort = (port) => {
    localStorage.setItem('anydrop_backend_port', port);
};
