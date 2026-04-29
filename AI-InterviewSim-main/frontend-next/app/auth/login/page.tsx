'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('LoginPage: Starting sign in...');

    try {
      const { error } = await signIn(email, password);
      console.log('LoginPage: signIn returned, error=', error);
      
      if (error) {
        setError(error.message || 'Failed to sign in');
      } else {
        console.log('LoginPage: Sign in successful, redirecting...');
        // Small delay to ensure cookies are set before server-side middleware checks
        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
      }
    } catch (err: any) {
      console.error('LoginPage: Unexpected error during sign in:', err);
      setError(err?.message || 'An unexpected error occurred');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20 bg-surface">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-headline">
            Luminal AI
          </Link>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-2xl p-8">
          <h1 className="text-3xl font-headline font-bold text-on-surface mb-2">Welcome back</h1>
          <p className="text-on-surface-variant mb-8">Sign in to continue your interview practice</p>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-label uppercase tracking-wider text-on-surface-variant mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-label uppercase tracking-wider text-on-surface-variant">
                  Password
                </label>
                <Link href="/auth/forgot-password" className="text-xs text-primary hover:text-secondary font-label">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bipolar-gradient py-3 rounded-lg text-on-primary font-headline font-bold text-lg disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-outline-variant/30"></div>
            <span className="text-on-surface-variant text-sm">or</span>
            <div className="flex-1 h-px bg-outline-variant/30"></div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={(e) => {
              e.preventDefault();
              console.log('Google sign in clicked');
              signInWithGoogle().catch(err => {
                console.error('Google sign in error:', err);
                setError('Failed to sign in with Google. Please try again.');
              });
            }}
            className="w-full flex items-center justify-center gap-3 bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface hover:bg-surface-container-highest transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-on-surface-variant">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-primary hover:text-secondary transition-colors font-bold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
