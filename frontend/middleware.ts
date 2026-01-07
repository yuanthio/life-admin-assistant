// life-admin-assistant/frontend/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const skipSetup = request.cookies.get('skipSetup')?.value;
  const { pathname } = request.nextUrl;

  console.log('Middleware - Path:', pathname, 'Token:', !!token, 'SkipSetup:', skipSetup);

  // Jika user sudah login
  if (token) {
    // Catatan: Kita TIDAK akan redirect ke /setup di sini lagi
    // Biarkan aplikasi frontend yang menangani logika ini berdasarkan template
    
    // Jika sudah login dan mengakses login/register, redirect ke dashboard
    if (pathname === '/login' || pathname === '/register') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Jika user belum login dan mengakses halaman terproteksi
  if (!token && (pathname.startsWith('/dashboard') || 
                 pathname.startsWith('/tasks') || 
                 pathname.startsWith('/templates') || 
                 pathname.startsWith('/reminders') ||
                 pathname === '/setup')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
    '/setup',
    '/templates/:path*',
    '/tasks/:path*',
    '/reminders/:path*'
  ],
};