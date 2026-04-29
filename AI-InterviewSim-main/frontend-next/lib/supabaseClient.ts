import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Use createBrowserClient so the session is stored in cookies (not just localStorage).
// This allows the Next.js middleware to see the session on subsequent requests.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
