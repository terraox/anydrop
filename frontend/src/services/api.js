import axios from 'axios';
import { getBackendBaseURL } from '../utils/backendConfig';

// Dynamic base URL - automatically detects backend port
// Supports flexible port configuration via environment variable or defaults to 8080
const baseURL = getBackendBaseURL();

const api = axios.create({
    baseURL,
    timeout: 15000, // 15 second timeout for local dev
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('anydrop_auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor for better error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle network errors
        if (!error.response) {
            console.error('Network Error:', error.message);
            error.message = 'Unable to connect to server. Please check if the backend is running.';
        }
        return Promise.reject(error);
    }
);

export default api;
