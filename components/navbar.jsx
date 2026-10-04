import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

/**
 * Shared application Navbar (Server Component).
 * Automatically reads the user session on the server to show:
 * - Brand logo/name on the left
 * - Navigation links (Dashboard, Courses)
 * - User email + Logout button (when authenticated)
 * - Login + Signup buttons (when unauthenticated)
 * - Dark mode theme toggle
 */
export async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  async function logout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold text-sm shadow-sm">
              L
            </span>
            <span>LMS Platform</span>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Courses
            </Link>
          </nav>
        </div>

        {/* Right: Auth Status & Theme Toggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block text-xs font-medium text-muted-foreground max-w-[180px] truncate">
                {user.email}
              </span>
              <form action={logout}>
                <Button variant="outline" size="sm" type="submit">
                  Log out
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

