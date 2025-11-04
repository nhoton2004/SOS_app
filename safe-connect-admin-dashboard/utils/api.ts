import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Tạo axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để thêm JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      
      // 401 Unauthorized - Token expired hoặc invalid
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login sẽ được xử lý ở App.tsx
        window.location.href = '/';
      }
      
      // 403 Forbidden - Không có quyền
      if (status === 403) {
        console.error('Access forbidden');
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

