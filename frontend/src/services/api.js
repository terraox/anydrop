import axios from 'axios';

const api = axios.create({
    baseURL: 'http://192.168.1.59:8080/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('anydrop_auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
