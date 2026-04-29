/**
 * Server-side authentication helpers for Next.js middleware
 * These functions validate JWT tokens with Supabase server-side
 */

import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Create a Supabase client for use in middleware
 * This properly handles cookies for session management
 */
export function createMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables in middleware');
    // Return a dummy client that will fail auth checks gracefully
    return createServerClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key',
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map(cookie => ({
          name: cookie.name,
          value: cookie.value,
        }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        });
      },
    },
  });
}

/**
 * Get and validate the current user session from request cookies
 * Returns the user if authenticated, null otherwise
 */
export async function getUserFromSession(
  request: NextRequest,
  response: NextResponse
) {
  try {
    const supabase = createMiddlewareClient(request, response);
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}

/**
 * Check if the request is authenticated
 * Returns boolean indicating valid session
 */
export async function isAuthenticated(
  request: NextRequest,
  response: NextResponse
): Promise<boolean> {
  const user = await getUserFromSession(request, response);
  return !!user;
}
