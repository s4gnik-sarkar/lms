import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
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
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem("theme")||"system";var r=t==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;var e=document.documentElement;e.classList.remove("light","dark");e.classList.add(r);e.style.colorScheme=r}catch(e){}})();`}
        </Script>
      </head>
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

          {/* Main application page content with top padding for floating navbar */}
          <main className="flex-1 flex flex-col pt-20 sm:pt-24">{children}</main>

          {/* Shared bottom footer */}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}