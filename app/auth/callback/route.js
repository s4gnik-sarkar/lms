import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Route Handler for Supabase OAuth Callback
 * 
 * Flow:
 * 1. User clicks "Continue with Google" on /login or /signup.
 * 2. Supabase redirects the browser to Google OAuth consent.
 * 3. Google authenticates the user and redirects to Supabase's callback URL:
 *    https://<project-ref>.supabase.co/auth/v1/callback
 * 4. Supabase processes the authentication tokens and redirects back to our app:
 *    http://localhost:3000/auth/callback?code=...
 * 5. This Route Handler exchanges the authorization code for a session cookie
 *    using `supabase.auth.exchangeCodeForSession(code)`.
 * 6. We sync the user's name and avatar into the existing `profiles` table.
 * 7. Finally, we redirect the user to the destination (default: /dashboard).
 */
export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const errorParam = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const roleParam = requestUrl.searchParams.get('role')
  let next = requestUrl.searchParams.get('next') ?? '/dashboard'

  // Security check: Prevent open redirect attacks by ensuring next is a relative URL path
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/dashboard'
  }

  // Handle errors sent back by OAuth provider (e.g. user canceled consent)
  if (errorParam || errorDescription) {
    const errorMsg = encodeURIComponent(errorDescription || errorParam || 'Authentication failed')
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${errorMsg}`)
  }

  if (code) {
    const supabase = await createClient()

    // Exchange the one-time authorization code for an authenticated user session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth code exchange failed:', error.message)
      const errorMsg = encodeURIComponent(error.message)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${errorMsg}`)
    }

    if (data?.user) {
      const user = data.user
      const metadata = user.user_metadata || {}

      // Extract user's display name and profile picture from Google metadata
      const fullName =
        metadata.full_name ||
        metadata.name ||
        (user.email ? user.email.split('@')[0] : '')
      const avatarUrl = metadata.avatar_url || metadata.picture || ''
      const assignedRole = roleParam === 'instructor' ? 'instructor' : 'student'

      try {
        // Query the existing profiles table to check if a profile record already exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role')
          .eq('id', user.id)
          .maybeSingle()

        if (!existingProfile && !fetchError) {
          // If the database trigger did not automatically create the profile,
          // insert it now with the user's chosen role and Google profile metadata.
          await supabase.from('profiles').insert({
            id: user.id,
            role: assignedRole,
            full_name: fullName,
            avatar_url: avatarUrl,
          })
        } else if (existingProfile) {
          // If profile exists, update missing full_name or avatar_url
          // without changing their existing role.
          const updates = {}
          if (!existingProfile.full_name && fullName) {
            updates.full_name = fullName
          }
          if (!existingProfile.avatar_url && avatarUrl) {
            updates.avatar_url = avatarUrl
          }
          if (Object.keys(updates).length > 0) {
            updates.updated_at = new Date().toISOString()
            await supabase.from('profiles').update(updates).eq('id', user.id)
          }
        }
      } catch (profileErr) {
        // Even if profile sync encounters an edge-case RLS error, do not fail login;
        // user is already authenticated.
        console.error('Failed to sync profile during OAuth callback:', profileErr)
      }

      // Handle forwarded host for reverse proxies (e.g. Vercel, production deployment)
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${requestUrl.origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${requestUrl.origin}${next}`)
      }
    }
  }

  // Fallback if no auth code was present in the callback URL
  return NextResponse.redirect(
    `${requestUrl.origin}/login?error=${encodeURIComponent('No authorization code provided.')}`
  )
}