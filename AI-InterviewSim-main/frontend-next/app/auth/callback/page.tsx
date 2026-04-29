'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent duplicate processing
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        // Wait a moment for session to be established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setError(error.message);
          setTimeout(() => router.push('/auth/login'), 3000);
          return;
        }

        if (data.session) {
          console.log('Session established, redirecting to dashboard');
          // Use window.location to prevent React navigation issues
          window.location.href = '/dashboard';
        } else {
          setError('No session found. Redirecting to login...');
          setTimeout(() => router.push('/auth/login'), 3000);
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError('Authentication failed. Redirecting to login...');
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-2xl font-headline font-bold text-error mb-2">Authentication Failed</h2>
          <p className="text-on-surface-variant mb-4">{error}</p>
          <p className="text-on-surface-variant text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-spin">🔄</div>
        <h2 className="text-2xl font-headline font-bold text-on-surface mb-2">Completing sign in...</h2>
        <p className="text-on-surface-variant">Please wait a moment</p>
      </div>
    </div>
  );
}
