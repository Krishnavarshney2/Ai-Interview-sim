import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/setup',
  '/interview',
  '/interview-text',
  '/feedback',
  '/practice',
  '/history',
  '/analytics',
  '/profile',
  '/admin',
];

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/signup',
];

// Public routes that NEVER require auth
const PUBLIC_ROUTES = ['/', '/about', '/contact', '/pricing'];

/**
 * Safe auth check that never throws
 */
async function safeIsAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    const { createServerClient } = await import('@supabase/ssr');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return false;
    }

    const response = NextResponse.next();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll() {},
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Always allow public routes
    if (PUBLIC_ROUTES.includes(pathname)) {
      return NextResponse.next();
    }

    // Check if accessing protected route
    const isProtectedRoute = PROTECTED_ROUTES.some(
      route => pathname === route || pathname.startsWith(route + '/')
    );

    // Check if accessing auth route (login/signup)
    const isAuthRoute = AUTH_ROUTES.some(
      route => pathname === route || pathname.startsWith(route + '/')
    );

    // If not protected and not auth route, allow through
    if (!isProtectedRoute && !isAuthRoute) {
      return NextResponse.next();
    }

    // Check auth status
    const authenticated = await safeIsAuthenticated(request);

    // If accessing protected route without authentication
    if (isProtectedRoute && !authenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If accessing auth route while already authenticated
    if (isAuthRoute && authenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // Fail open - allow the request
    return NextResponse.next();
  }
}

// Simplified matcher - only run on pages, not static files or API
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
