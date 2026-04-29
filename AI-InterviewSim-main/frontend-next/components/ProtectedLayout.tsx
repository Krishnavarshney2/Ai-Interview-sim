/**
 * Server component that provides authenticated user data to client components
 * This component runs on the server and passes user data as props
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

interface ProtectedLayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export async function getUserSession() {
  const cookieStore = cookies();

  // Create Supabase server component client with cookie access
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll() {
          // Server components can't set cookies, this is handled by middleware
        },
      },
    }
  );

  // Get the current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export default async function ProtectedLayout({
  children,
  requireAuth = true,
  redirectTo = '/auth/login',
}: ProtectedLayoutProps) {
  // Get user session server-side
  const user = await getUserSession();

  // Redirect if authentication is required but user is not logged in
  if (requireAuth && !user) {
    redirect(redirectTo);
  }

  // Render children with user context available
  return <>{children}</>;
}
