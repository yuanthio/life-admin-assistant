// life-admin-assistant/frontend/components/AuthGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Tunggu loading selesai dari useAuth
    if (!loading) {
      setIsChecking(false);
      
      // Jika tidak terautentikasi dan sedang di halaman yang diproteksi, redirect ke login
      if (!isAuthenticated && typeof window !== 'undefined') {
        // Cek apakah kita sudah di halaman login
        if (window.location.pathname !== '/login') {
          router.push('/login');
        }
      }
    }
  }, [isAuthenticated, loading, router]);

  // Show loading spinner
  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  // Jika tidak terautentikasi, return null (akan di-redirect oleh useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // Jika terautentikasi, tampilkan children
  return <>{children}</>;
}