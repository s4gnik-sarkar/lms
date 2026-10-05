'use client'

import { usePathname } from 'next/navigation'

/**
 * Simple, elegant application footer.
 *
 * Hidden on the auth screens (/login and /signup) so nothing sits below the
 * auth card — those pages center it in the whole viewport instead.
 */
export function Footer() {
  const pathname = usePathname()

  // Auth screens provide their own full-viewport centered layout
  if (pathname === '/login' || pathname === '/signup') return null

  return (
    <footer className="w-full border-t bg-background py-6 mt-auto">
      <div className="container mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} LMS Platform. All rights reserved.</p>
        <p className="flex items-center gap-2">
          <span>Built with Next.js, Supabase & shadcn/ui</span>
        </p>
      </div>
    </footer>
  )
}

