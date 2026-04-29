'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password);

    if (error) {
      // Handle specific error types
      if (error.message.includes('already') || error.message.includes('registered')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (error.message.includes('email')) {
        setError(error.message);
      } else {
        setError(error.message || 'Failed to create account. Please try again.');
      }
      setLoading(false);
    } else {
      setSuccess(true);
      // If auto-login happened, we redirect. Otherwise show confirmation message.
      setLoading(false);
    }
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

        {/* Signup Card */}
        <div className="glass-panel rounded-2xl p-8">
          <h1 className="text-3xl font-headline font-bold text-on-surface mb-2">Create account</h1>
          <p className="text-on-surface-variant mb-8">Start your AI interview practice today</p>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-lg bg-tertiary/10 border border-tertiary/20 text-tertiary text-sm">
              <span className="font-bold">Account created successfully!</span>
              <br />
              If email verification is required, please check your inbox. Otherwise, you will be redirected automatically.
              <br />
              <Link href="/auth/login" className="underline font-bold">Click here to sign in</Link>
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
              <label className="block text-sm font-label uppercase tracking-wider text-on-surface-variant mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-label uppercase tracking-wider text-on-surface-variant mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full bipolar-gradient py-3 rounded-lg text-on-primary font-headline font-bold text-lg disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-outline-variant/30"></div>
            <span className="text-on-surface-variant text-sm">or</span>
            <div className="flex-1 h-px bg-outline-variant/30"></div>
          </div>

          {/* Google Sign Up */}
          <button
            onClick={(e) => {
              e.preventDefault();
              console.log('Google sign up clicked');
              signInWithGoogle().catch(err => {
                console.error('Google sign up error:', err);
                setError('Failed to sign up with Google. Please try again.');
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

        {/* Login Link */}
        <p className="text-center mt-6 text-on-surface-variant">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:text-secondary transition-colors font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
