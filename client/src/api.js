import axios from 'axios';

const API_HOST = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;

const api = axios.create({
    baseURL: `${API_HOST}/api`
});

// Add interceptor to include token in headers
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads/') || url.startsWith('uploads/')) return `${API_HOST}${url.startsWith('/') ? '' : '/'}${url}`;
    return url;
};

export default api;

