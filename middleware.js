import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

/**
 * Next.js Middleware for Supabase Session Management
 *
 * Responsibilities:
 * 1. Session Refresh: Refreshes short-lived Supabase auth tokens before they expire,
 *    updating session cookies on incoming requests and outgoing responses.
 * 2. Protected Routes: Unauthenticated users visiting protected pages (/dashboard, /courses/new)
 *    are redirected immediately to /login.
 * 3. Guest Only Routes: Authenticated users visiting /login or /signup
 *    are redirected directly to /dashboard.
 */
export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT run code between createServerClient and supabase.auth.getUser().
  // getUser() validates the JWT against Supabase's auth server and refreshes expired tokens.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protected paths that require authentication
  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/courses/new') ||
    pathname.startsWith('/my-courses')

  if (isProtectedPath && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.search = `?next=${encodeURIComponent(pathname)}`
    return NextResponse.redirect(redirectUrl)
  }

  // Auth paths that should only be accessible when logged out
  const isAuthPath = pathname === '/login' || pathname === '/signup'

  if (isAuthPath && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static chunks and files)
     * - _next/image (image optimization API)
     * - favicon.ico (browser favicon)
     * - auth/callback (OAuth code exchange route handler)
     * - Static asset extensions (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}