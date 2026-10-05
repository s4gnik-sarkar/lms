import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NavbarClient } from '@/components/navbar-client'

/**
 * Shared Application Navbar (Server Component).
 *
 * Architecture:
 * - Reads the logged-in user on the server using Supabase SSR cookie auth.
 * - Defines the `logout` Server Action directly on the server.
 * - Passes `user` and `logoutAction` as props to `NavbarClient`.
 * - This prevents client-side session waterfalls and keeps auth cookie handling secure.
 */
export async function Navbar() {
  // 1. Fetch user on the server from session cookies
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 2. Server Action to safely log out and redirect
  async function logout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  // 3. Render client component with server data passed as props
  return <NavbarClient user={user} logoutAction={logout} />
}