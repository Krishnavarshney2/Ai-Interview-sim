'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const authStateRef = useRef({ hasSession: false, isProcessing: false });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        authStateRef.current.hasSession = true;
        setSession(session);
        setUser(session.user ?? null);
      }
      setLoading(false);
    });

    // Listen for auth changes with debounce
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Prevent duplicate processing
      if (authStateRef.current.isProcessing) return;

      const hasSession = !!session;
      const prevHasSession = authStateRef.current.hasSession;

      // Only update if state actually changed
      if (hasSession !== prevHasSession) {
        authStateRef.current.isProcessing = true;
        authStateRef.current.hasSession = hasSession;

        setSession(session);
        setUser(session?.user ?? null);

        if (loading) {
          setLoading(false);
        }

        // Reset processing flag
        setTimeout(() => {
          authStateRef.current.isProcessing = false;
        }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Attempting sign in for', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('AuthContext: signInWithPassword response:', { hasSession: !!data?.session, error: error?.message });
      
      if (error) {
        console.error('AuthContext: Sign in error:', error.message);
        return { error };
      }
      
      if (data?.session) {
        console.log('AuthContext: Sign in successful, session received for user:', data.session.user?.email);
        setSession(data.session);
        setUser(data.session.user ?? null);
        authStateRef.current.hasSession = true;
        // Let the caller handle navigation
        return { error: null };
      }
      
      console.error('AuthContext: No session returned after sign in. data=', data);
      return { error: { message: 'No session returned. Please check your email and password.' } };
    } catch (err: any) {
      console.error('AuthContext: Unexpected sign in error:', err);
      return { error: { message: err?.message || 'An unexpected error occurred during sign in.' } };
    }
  };

  const signUp = async (email: string, password: string) => {
    // First, check if we can sign in (user might already exist)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If sign in works, user already exists
    if (signInData.session) {
      return { error: { message: 'An account with this email already exists. Please sign in instead.' } };
    }

    // Try to sign up
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    
    if (error) {
      if (error.message.includes('User already registered')) {
        return { error: { message: 'This email is already registered. Please sign in instead.' } };
      }
      return { error };
    }

    // Auto-login after signup if session is available (email confirmations disabled)
    if (data.session) {
      setSession(data.session);
      setUser(data.session.user ?? null);
      authStateRef.current.hasSession = true;
      window.location.href = '/dashboard';
    }
    
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const signInWithGoogle = useCallback(async () => {
    // Supabase automatically handles duplicate accounts by email
    // If user exists with same email, it will link the Google identity
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // queryParams: {
        //   auth_mode: 'pkce',
        // },
      },
    });

    if (error) {
      // Handle identity linking errors
      if (error.message.includes('already registered') || error.message.includes('Identity already exists')) {
        throw new Error('This Google account is already linked to an existing account. Please sign in instead.');
      }
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
