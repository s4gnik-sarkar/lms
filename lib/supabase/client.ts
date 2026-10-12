import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for Client Components (runs in the browser).
 * Uses placeholder credentials if environment variables are not set,
 * allowing the application to build and run in scaffold mode.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'placeholder-anon-key'

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

