'use client'

import { FloatingNav } from '@/components/ui/floating-navbar'

/**
 * Client component part of the Navbar.
 * Delegates rendering to the modern Aceternity-inspired FloatingNav.
 *
 * Props:
 * - `user`: The authenticated user object passed from the server Navbar component (or null if logged out).
 * - `logoutAction`: Server Action passed from the server Navbar to sign out the user.
 */
export function NavbarClient({ user, logoutAction }) {
  return <FloatingNav user={user} logoutAction={logoutAction} />
}