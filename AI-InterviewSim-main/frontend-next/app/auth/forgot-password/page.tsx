'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSent(true);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20 bg-surface">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-headline">
            Luminal AI
          </Link>
        </div>

        <div className="glass-panel rounded-2xl p-8">
          <h1 className="text-3xl font-headline font-bold text-on-surface mb-2">Reset Password</h1>
          <p className="text-on-surface-variant mb-8">Enter your email and we'll send you a reset link.</p>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-tertiary/10 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-tertiary text-2xl">mail</span>
              </div>
              <h2 className="text-xl font-headline font-bold">Check your email</h2>
              <p className="text-on-surface-variant text-sm">
                We've sent a password reset link to <strong>{email}</strong>. Click the link to reset your password.
              </p>
              <Link href="/auth/login" className="text-primary hover:text-secondary font-bold text-sm">
                Back to login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bipolar-gradient py-3 rounded-lg text-on-primary font-headline font-bold text-lg disabled:opacity-50 transition-all"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <p className="text-center mt-6 text-on-surface-variant text-sm">
                Remember your password?{' '}
                <Link href="/auth/login" className="text-primary hover:text-secondary font-bold">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
