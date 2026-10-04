import { createBrowserClient } from '@supabase/ssr'

// This function creates a Supabase client for Client Components (runs in the browser).
// Under the hood, createBrowserClient stores session tokens in browser cookies (instead of localStorage)
// so that the Next.js server can also read the user's session when rendering server components.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
}
