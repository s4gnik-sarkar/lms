'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

/**
 * Client component part of the Navbar.
 *
 * Why a Client Component?
 * 1. `usePathname()` is a React Hook only available in Client Components to detect active links.
 * 2. Mobile hamburger menu requires local state (`useState`) to toggle open/closed.
 *
 * Props:
 * - `user`: The authenticated user object passed from the server Navbar component (or null if logged out).
 * - `logoutAction`: Server Action passed from the server Navbar to sign out the user.
 */
export function NavbarClient({ user, logoutAction }) {
  // State for mobile hamburger drawer
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Current URL path to highlight the active navigation link
  const pathname = usePathname()

  // Links shown when user is LOGGED OUT
  const loggedOutLinks = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ]

  // Links shown when user is LOGGED IN
  const loggedInLinks = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Courses', href: '/courses' },
  ]

  const links = user ? loggedInLinks : loggedOutLinks

  // Helper to check if a navigation link matches the current path
  const isActive = (href) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="relative sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* ============================================================== */}
        {/* Left: Brand Logo & Navigation Links                            */}
        {/* ============================================================== */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold shadow-sm">
              <BookOpen className="h-5 w-5" />
            </span>
            <span>LMS Platform</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    active
                      ? 'text-primary font-semibold underline underline-offset-8 decoration-2'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* ============================================================== */}
        {/* Right: Auth Buttons & Theme Toggle (Desktop)                   */}
        {/* ============================================================== */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />

          {user ? (
            // LOGGED IN DESKTOP VIEW: Show email + Logout button
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground max-w-[180px] truncate">
                {user.email}
              </span>
              <form action={logoutAction}>
                <Button variant="outline" size="sm" type="submit">
                  Log out
                </Button>
              </form>
            </div>
          ) : (
            // LOGGED OUT DESKTOP VIEW: One "Login / Signup" button routing to /login
            <Button size="sm" asChild>
              <Link href="/login">Login / Signup</Link>
            </Button>
          )}
        </div>

        {/* ============================================================== */}
        {/* Mobile Hamburger Menu Toggle Button                            */}
        {/* ============================================================== */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
            className="h-9 w-9"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* Mobile Collapsible Navigation Menu                             */}
      {/* ============================================================== */}
      {isMenuOpen && (
        <div className="border-t bg-background px-4 py-4 md:hidden animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-3">
            {links.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>

          <div className="mt-4 pt-4 border-t flex flex-col gap-3">
            {user ? (
              // LOGGED IN MOBILE VIEW
              <>
                <div className="text-xs text-muted-foreground px-3">
                  Signed in as: <strong className="text-foreground">{user.email}</strong>
                </div>
                <form action={logoutAction} className="w-full">
                  <Button variant="outline" size="sm" type="submit" className="w-full">
                    Log out
                  </Button>
                </form>
              </>
            ) : (
              // LOGGED OUT MOBILE VIEW: One "Login / Signup" button routing to /login
              <Button size="sm" asChild className="w-full">
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  Login / Signup
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}