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
    if (typeof window === 'undefined') {
        return 'http://localhost:8080/api';
    }
    
    const port = getBackendPort();
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    return `${protocol}//${hostname}:${port}/api`;
};

/**
 * Get the backend WebSocket URL
 * @param {string} path - WebSocket path (e.g., '/ws', '/transfer')
 * @returns {string} WebSocket URL
 */
export const getBackendWebSocketURL = (path) => {
    if (typeof window === 'undefined') {
        return `ws://localhost:8080${path}`;
    }
    
    const port = getBackendPort();
    const hostname = window.location.hostname;
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
