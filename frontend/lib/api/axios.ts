// life-admin-assistant/frontend/lib/api/axios.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout (diperpanjang)
  withCredentials: true, // Tambahkan ini untuk CORS dengan cookie
});

// Interceptor untuk menambahkan token ke setiap request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('Request error:', {
      message: error.message,
      config: error.config
    });
    return Promise.reject(error);
  }
);

// Interceptor untuk menangani response error
api.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      url: response.config.url,
      status: response.status,
      method: response.config.method
    });
    return response;
  },
  (error) => {
    // Handle berbagai tipe error
    if (error.response) {
      // Server responded dengan status code di luar range 2xx
      console.error('Response error:', {
        status: error.response.status,
        url: error.config?.url,
        data: error.response.data,
        message: error.response.data?.message || 'Server error'
      });
    } else if (error.request) {
      // Request dibuat tapi tidak ada response (network error)
      console.error('Network error:', {
        message: 'No response received from server',
        url: error.config?.url,
        request: error.request
      });
      
      // Buat error object yang konsisten
      error.response = {
        status: 0,
        data: {
          message: 'Network error: Please check your internet connection and try again.',
          error: 'Network Error'
        }
      };
    } else {
      // Error saat setup request
      console.error('Request setup error:', {
        message: error.message,
        config: error.config
      });
      
      error.response = {
        status: 0,
        data: {
          message: 'Request setup error: ' + error.message,
          error: 'Setup Error'
        }
      };
    }
    
    // Cek untuk 401 Unauthorized
    if (error.response?.status === 401) {
      console.warn('Unauthorized access detected');
      
      if (typeof window !== 'undefined') {
        // Simpan current path untuk redirect setelah login
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login')) {
          localStorage.setItem('redirectAfterLogin', currentPath);
        }
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login
        if (!window.location.pathname.includes('/login')) {
          setTimeout(() => {
            window.location.href = '/login?redirect=' + encodeURIComponent(currentPath);
          }, 100);
        }
      }
    }
    
    // Tetap throw error agar bisa ditangkap oleh caller
    return Promise.reject(error);
  }
);