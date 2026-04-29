import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient, isAuthenticated } from './lib/auth-helpers';

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

// Allowed internal paths for redirect validation (prevent open redirect)
const ALLOWED_REDIRECT_PATHS = [
  '/dashboard',
  '/setup',
  '/interview',
  '/interview-text',
  '/feedback',
  '/auth/login',
  '/auth/signup',
  '/',
];

/**
 * Validate redirect URL to prevent open redirect vulnerability
 * Only allows internal paths from the whitelist
 */
function isValidRedirect(path: string): boolean {
  // Block external URLs (check for protocol or hostname)
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return false;
  }

  // Block javascript: and data: URIs
  if (path.toLowerCase().startsWith('javascript:') || path.toLowerCase().startsWith('data:')) {
    return false;
  }

  // Check against whitelist
  return ALLOWED_REDIRECT_PATHS.some(
    allowedPath => path === allowedPath || path.startsWith(allowedPath + '/') || path.startsWith(allowedPath + '?')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Create a response object that we can modify
  const response = NextResponse.next();

  // Check if accessing protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(
    route => pathname.startsWith(route)
  );

  // Check if accessing auth route (login/signup)
  const isAuthRoute = AUTH_ROUTES.some(
    route => pathname.startsWith(route)
  );

  // Validate JWT token server-side using Supabase
  const authenticated = await isAuthenticated(request, response);

  // If accessing protected route without authentication
  if (isProtectedRoute && !authenticated) {
    // Redirect to login with validated return URL
    const loginUrl = new URL('/auth/login', request.url);
    
    // Only add redirectTo if it's a valid internal path
    if (isValidRedirect(pathname)) {
      loginUrl.searchParams.set('redirectTo', pathname);
    }
    
    return NextResponse.redirect(loginUrl);
  }

  // If accessing auth route while already authenticated
  if (isAuthRoute && authenticated) {
    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Refresh session if needed - Supabase SSR client handles this automatically
  // by updating cookies in the response
  
  // Allow request to continue
  return response;
}

// Configure which paths trigger the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled by backend)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|$).*)',
  ],
};
