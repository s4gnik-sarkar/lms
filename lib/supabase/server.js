import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// This function creates a Supabase client for Server Components, Server Actions, and Route Handlers.
// It reads authentication cookies sent by the browser to know who is logged in.
export async function createClient() {
  // In modern Next.js (App Router), cookies() is an asynchronous function.
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        // Reads all cookies from the incoming browser request
        getAll() {
          return cookieStore.getAll()
        },
        // Updates cookies on outgoing response (works inside Server Actions and Route Handlers)
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // Server Components can only read cookies, not set them.
            // This catch block safely ignores that limitation.
          }
        },
      },
    }
  )
}
