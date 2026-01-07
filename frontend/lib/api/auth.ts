// life-admin-assistant/frontend/lib/api/auth.ts
import { api } from './axios';

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: Omit<User, 'createdAt' | 'updatedAt'>;
}

export const authApi = {
  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    if (response.data.token && typeof window !== 'undefined') {
      // Simpan di localStorage untuk client-side
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Simpan di cookie untuk middleware
      document.cookie = `token=${response.data.token}; path=/; max-age=${60 * 60 * 24}`; // 1 hari
      
      // Hapus cookie skipSetup agar user baru diarahkan ke setup
      document.cookie = 'skipSetup=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    return response.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    
    // Update localStorage dengan data user terbaru
    if (typeof window !== 'undefined' && response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Clear cookie juga
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'skipSetup=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  },

  getCurrentUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('token');
    }
    return false;
  },
};