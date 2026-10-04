import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

// Load modern Inter typography font via next/font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

// Application-wide page metadata
export const metadata: Metadata = {
  title: 'LMS Platform - Learn & Teach Online',
  description: 'Modern Learning Management System built with Next.js, Supabase, and shadcn/ui.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground antialiased`}>
        {/* next-themes provider manages the dark/light class on <html> */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Shared top navigation bar */}
          <Navbar />

          {/* Main application page content */}
          <main className="flex-1 flex flex-col">{children}</main>

          {/* Shared bottom footer */}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}