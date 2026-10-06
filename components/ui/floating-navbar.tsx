'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Home,
  BookOpen,
  Search,
  Info,
  Mail,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  User,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { BorderBeam } from '@/components/ui/border-beam'
import { cn } from '@/lib/utils'

export interface NavItem {
  name: string
  link: string
  icon?: React.ReactNode
}

export interface FloatingNavProps {
  navItems?: NavItem[]
  className?: string
  user?: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
      name?: string
      avatar_url?: string
    }
  } | null
  logoutAction?: () => Promise<void>
}

/**
 * Inner component that interacts with useSearchParams.
 * Wraps the search input inside BorderBeam for an animated traveling glow border.
 */
function SearchInput({
  onSearch,
  className,
}: {
  onSearch?: () => void
  className?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qParam = searchParams.get('q') || ''
  const [query, setQuery] = useState(qParam)
  const [prevQ, setPrevQ] = useState(qParam)
  const [isFocused, setIsFocused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Adjust state during render when search param changes
  if (prevQ !== qParam) {
    setPrevQ(qParam)
    setQuery(qParam)
  }

  // Detect user prefers-reduced-motion setting via useSyncExternalStore
  const reducedMotion = React.useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined') return () => {}
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      mq.addEventListener('change', callback)
      return () => mq.removeEventListener('change', callback)
    },
    () => (typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false),
    () => false
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/courses?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push('/courses')
    }
    if (onSearch) onSearch()
  }

  return (
    <form
      onSubmit={handleSubmit}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn('relative w-full', className)}
    >
      <BorderBeam
        size="sm"
        colorVariant="ocean"
        theme="auto"
        borderRadius={9999}
        active={!reducedMotion}
        staticColors={reducedMotion}
        duration={isFocused ? 1.8 : 2.8}
        brightness={isFocused ? 1.7 : isHovered ? 1.45 : 1.15}
        strength={isFocused ? 1 : isHovered ? 0.9 : 0.75}
        className="w-full rounded-full"
      >
        <div className="relative flex items-center w-full rounded-full">
          <Search
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 transition-colors z-10',
              isFocused ? 'text-primary' : 'text-muted-foreground/70'
            )}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="What do you want to learn?"
            aria-label="Search courses"
            className="h-9 w-full rounded-full border border-border/60 bg-muted/50 pl-9 pr-8 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-primary/50 focus:bg-background focus:ring-1 focus:ring-primary/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                router.push('/courses')
              }}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground cursor-pointer z-10"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </BorderBeam>
    </form>
  )
}

/**
 * Aceternity-inspired Floating Navbar Component.
 *
 * Characteristics:
 * - Fixed, centered, pill-shaped floating bar with rounded-full geometry.
 * - Backdrop blur, soft shadow, subtle border, semi-transparent background (light & dark compatible).
 * - Scroll direction listener: slides up & fades out on scroll down, slides back in on scroll up.
 * - Respects prefers-reduced-motion and avoids re-renders on every scroll pixel.
 * - Three desktop zones: Left (Logo, Home, Courses), Center (Search bar), Right (About, Contact, Auth).
 * - Responsive mobile drawer with expandable search and accessible navigation.
 */
export function FloatingNav({
  navItems,
  className,
  user,
  logoutAction,
}: FloatingNavProps) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const lastScrollY = useRef(0)

  // Determine Courses link behavior based on login state
  const coursesLink = user
    ? { name: 'My Courses', link: '/my-courses', icon: <BookOpen className="size-3.5" /> }
    : { name: 'Courses', link: '/courses', icon: <BookOpen className="size-3.5" /> }

  const defaultLeftItems: NavItem[] = [
    { name: 'Home', link: '/', icon: <Home className="size-3.5" /> },
    coursesLink,
  ]

  const rightItems: NavItem[] = [
    { name: 'About Us', link: '/about', icon: <Info className="size-3.5" /> },
    { name: 'Contact', link: '/contact', icon: <Mail className="size-3.5" /> },
  ]

  const leftItems = navItems || defaultLeftItems

  // Helper to check if a navigation link is active
  const isActive = useCallback(
    (href: string) => {
      if (href === '/') return pathname === '/'
      return pathname.startsWith(href)
    },
    [pathname]
  )

  // Scroll listener: detects direction and updates state ONLY on direction changes
  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY

          // Always visible near the top of the page
          if (currentScrollY < 40) {
            setVisible(true)
          } else {
            const diff = currentScrollY - lastScrollY.current

            // Scrolling DOWN (with a minimum delta to avoid jitter)
            if (diff > 8 && currentScrollY > 70) {
              // Keep visible if mobile menu or search is open
              if (!isMenuOpen) {
                setVisible(false)
              }
            } else if (diff < -8) {
              // Scrolling UP
              setVisible(true)
            }
          }

          lastScrollY.current = currentScrollY
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isMenuOpen])

  // Close mobile menus on route navigation (render-time state adjustment)
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setIsMenuOpen(false)
    setMobileSearchOpen(false)
  }

  const userInitial =
    user?.user_metadata?.full_name?.[0]?.toUpperCase() ||
    user?.user_metadata?.name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    'U'

  return (
    <div
      className={cn(
        'fixed top-3 sm:top-5 inset-x-0 mx-auto z-50 w-[95%] max-w-5xl transition-all duration-300 ease-in-out motion-reduce:transition-none',
        visible
          ? 'translate-y-0 opacity-100'
          : '-translate-y-24 opacity-0 pointer-events-none'
      )}
    >
      {/* ================================================================== */}
      {/* MAIN PILL-SHAPED FLOATING CONTAINER                                */}
      {/* ================================================================== */}
      <nav
        aria-label="Main Floating Navigation"
        className={cn(
          'relative flex items-center justify-between gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-2 sm:px-4 sm:py-2.5 shadow-lg shadow-black/5 dark:shadow-black/25 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65',
          className
        )}
      >
        {/* ---------------------------------------------------------------- */}
        {/* ZONE 1: LEFT - Logo & Core Links                                  */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold tracking-tight text-foreground transition-opacity hover:opacity-85"
            aria-label="LMS Platform Home"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-extrabold shadow-sm ring-2 ring-primary/20">
              <Sparkles className="size-4" />
            </span>
            <span className="font-extrabold text-sm sm:text-base tracking-tight hidden xs:inline">
              LMS
            </span>
          </Link>

          {/* Left Navigation Links (Home, Courses/My Courses) */}
          <div className="hidden md:flex items-center gap-1 sm:gap-1.5">
            {leftItems.map((item) => {
              const active = isActive(item.link)
              return (
                <Link
                  key={item.link}
                  href={item.link}
                  className={cn(
                    'relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs lg:text-sm font-medium transition-all',
                    active
                      ? 'bg-accent text-accent-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* ZONE 2: CENTER - Visual Focus Search Bar                          */}
        {/* ---------------------------------------------------------------- */}
        <div className="hidden sm:flex flex-1 max-w-[200px] md:max-w-xs lg:max-w-sm mx-2">
          <React.Suspense
            fallback={
              <div className="h-9 w-full rounded-full bg-muted/40 animate-pulse" />
            }
          >
            <SearchInput />
          </React.Suspense>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* ZONE 3: RIGHT - Secondary Links, Auth & Theme Toggle              */}
        {/* ---------------------------------------------------------------- */}
        <div className="hidden md:flex items-center gap-1.5 lg:gap-2.5 shrink-0">
          {/* About & Contact (Hidden on tight screens to avoid crowding) */}
          <div className="hidden lg:flex items-center gap-1">
            {rightItems.map((item) => {
              const active = isActive(item.link)
              return (
                <Link
                  key={item.link}
                  href={item.link}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs lg:text-sm font-medium transition-all',
                    active
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          <ThemeToggle />

          {user ? (
            /* Logged-In User Controls */
            <div className="flex items-center gap-2 pl-1 border-l border-border/50">
              <Link
                href="/dashboard"
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs lg:text-sm font-medium transition-all',
                  isActive('/dashboard')
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
                title="Dashboard"
              >
                <LayoutDashboard className="size-3.5" />
                <span className="hidden xl:inline">Dashboard</span>
              </Link>

              {/* User Avatar Circle */}
              <div
                className="flex size-7 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary"
                title={user.email}
              >
                {userInitial}
              </div>

              {logoutAction && (
                <form action={logoutAction}>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="submit"
                    aria-label="Log out"
                    className="h-8 rounded-full px-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="size-3.5 sm:mr-1" />
                    <span className="hidden xl:inline">Log out</span>
                  </Button>
                </form>
              )}
            </div>
          ) : (
            /* Logged-Out Guest Button */
            <Button size="sm" asChild className="rounded-full h-8 px-3.5 text-xs shadow-xs font-semibold">
              <Link href="/login">Login / Signup</Link>
            </Button>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* MOBILE CONTROLS (Screen width < md)                               */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex items-center gap-1 sm:hidden">
          {/* Toggle Mobile Search */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="Toggle search input"
            className="size-8 rounded-full"
          >
            <Search className="size-4" />
          </Button>

          <ThemeToggle />

          {/* Toggle Hamburger Drawer */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation drawer"
            className="size-8 rounded-full"
          >
            {isMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </nav>

      {/* ================================================================== */}
      {/* MOBILE EXPANDABLE SEARCH BAR (When toggled on mobile)              */}
      {/* ================================================================== */}
      {mobileSearchOpen && (
        <div className="mt-2 sm:hidden rounded-2xl border border-border/60 bg-background/95 p-2 shadow-lg backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <React.Suspense
            fallback={
              <div className="h-9 w-full rounded-full bg-muted/40 animate-pulse" />
            }
          >
            <SearchInput onSearch={() => setMobileSearchOpen(false)} />
          </React.Suspense>
        </div>
      )}

      {/* ================================================================== */}
      {/* MOBILE COLLAPSIBLE DRAWER                                          */}
      {/* ================================================================== */}
      {isMenuOpen && (
        <div className="mt-2 md:hidden rounded-3xl border border-border/60 bg-background/95 p-4 shadow-xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-3">
          {/* Mobile Search input inside drawer */}
          <div className="mb-4">
            <React.Suspense
              fallback={
                <div className="h-9 w-full rounded-full bg-muted/40 animate-pulse" />
              }
            >
              <SearchInput onSearch={() => setIsMenuOpen(false)} />
            </React.Suspense>
          </div>

          <div className="flex flex-col gap-1.5">
            {/* Left Items (Home, Courses / My Courses) */}
            {leftItems.map((item) => {
              const active = isActive(item.link)
              return (
                <Link
                  key={item.link}
                  href={item.link}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              )
            })}

            {/* Right Items (About Us, Contact) */}
            {rightItems.map((item) => {
              const active = isActive(item.link)
              return (
                <Link
                  key={item.link}
                  href={item.link}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              )
            })}

            {/* If logged in: Dashboard link */}
            {user && (
              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  isActive('/dashboard')
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <LayoutDashboard className="size-4" />
                <span>Dashboard</span>
              </Link>
            )}
          </div>

          {/* Auth Section in Mobile Menu */}
          <div className="mt-4 pt-3 border-t border-border/50">
            {user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                  <User className="size-3.5" />
                  <span className="truncate max-w-[220px] font-medium text-foreground">
                    {user.email}
                  </span>
                </div>
                {logoutAction && (
                  <form action={logoutAction} className="w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      type="submit"
                      className="w-full rounded-xl gap-2 text-destructive hover:text-destructive"
                    >
                      <LogOut className="size-4" />
                      Log out
                    </Button>
                  </form>
                )}
              </div>
            ) : (
              <Button asChild size="sm" className="w-full rounded-xl font-semibold">
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  Login / Signup
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

