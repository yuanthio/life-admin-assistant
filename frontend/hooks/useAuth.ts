// life-admin-assistant/frontend/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { authApi, User } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      
      if (token && storedUser) {
        try {
          // Verifikasi token dengan server
          const response = await authApi.getMe();
          setUser(response.user);
          console.log("User authenticated via token:", response.user.email);
        } catch (error) {
          console.error('Failed to verify token:', error);
          // Token mungkin expired, clear dan logout
          authApi.logout();
          setUser(null);
        }
      } else {
        // Tidak ada token atau user, pastikan user null
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      authApi.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    
    // Listen for storage changes (untuk handle login/logout dari tab lain)
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authApi.login({ email, password });
      setUser(response.user);
      
      // Set cookie untuk middleware
      document.cookie = `token=${response.token}; path=/; max-age=${60 * 60 * 24}`; // 1 hari
      
      return { success: true, data: response };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    try {
      setLoading(true);
      const response = await authApi.register({ email, password, name });
      return { success: true, data: response };
    } catch (error: any) {
      console.error('Register error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    // Clear semua cookies terkait auth
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'skipSetup=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'hasTemplates=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setUser(null);
    router.push('/');
  }, [router]);

  const updateUser = useCallback((userData: User) => {
    setUser(userData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  }, []);

  return {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };
};