/**
 * Simple, elegant application footer.
 */
export function Footer() {
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

