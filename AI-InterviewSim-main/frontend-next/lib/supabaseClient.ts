import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Warn instead of throwing so builds don't fail when env vars aren't available at build time
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.warn('Missing Supabase environment variables. Auth features will not work.')
  }
}

// Use createBrowserClient so the session is stored in cookies (not just localStorage).
// This allows the Next.js middleware to see the session on subsequent requests.
export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)
