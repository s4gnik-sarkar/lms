'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { createClient } from '@/lib/supabase/client'
import AuthCardShell from '@/components/ui/auth-card-shell'
import KineticGrid from '@/components/ui/kinetic-grid'
import { FloatingTechIcons } from '@/components/ui/floating-tech-icons'
import { TypewriterHeading } from '@/components/ui/typewriter-heading'

const LOGIN_PHRASES = [
  'Welcome back. Keep building.',
  'From first line to full deployment.',
  'Master React, Next.js & TypeScript.',
  'Ship your next cloud & IoT project.',
  'Your skills. Your pace. Your future.',
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    async function checkExistingSession() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        router.replace('/dashboard')
        return
      }
      const savedEmail = localStorage.getItem('lms_remembered_email')
      if (savedEmail) {
        setEmail(savedEmail)
        setRememberMe(true)
      }

      // Check for OAuth error message passed via redirect query params
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const oauthError = params.get('error_description') || params.get('error')
        if (oauthError) {
          setError(decodeURIComponent(oauthError))
        }
      }

      setCheckingAuth(false)
    }
    checkExistingSession()
  }, [router])

  async function handleGoogleLogin() {
    setError(null)
    setGoogleLoading(true)
    try {
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (oauthError) {
        setError(oauthError.message)
        setGoogleLoading(false)
      }
    } catch (err) {
      setError(`Connection error: ${err.message || 'Unable to connect to Google OAuth.'}`)
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (rememberMe) localStorage.setItem('lms_remembered_email', email)
      else localStorage.removeItem('lms_remembered_email')
      const { error: signInError } = await createClient().auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        setError(
          signInError.message.toLowerCase().includes('invalid login credentials')
            ? 'Incorrect email or password. Please double-check your credentials.'
            : signInError.message
        )
        setLoading(false)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(`Connection error: ${err.message || 'Unable to connect to Supabase.'}`)
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <KineticGrid className="min-h-[calc(100vh-4rem)] p-4 flex items-center justify-center">
        <div className="rounded-2xl border border-white/10 bg-black/60 px-7 py-5 text-base text-white/80 backdrop-blur-xl">
          Checking authentication session...
        </div>
      </KineticGrid>
    )
  }

  return (
    <KineticGrid className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-12 flex items-center justify-center">
      {/* Background Floating Tech Icons */}
      <FloatingTechIcons />

      {/* Main Responsive Grid Container */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        {/* Left Column on Desktop / Top Header on Mobile */}
        <div className="w-full max-w-xl">
          <TypewriterHeading
            phrases={LOGIN_PHRASES}
            badge="✦ Welcome Back"
            subtitle="Pick up your learning journey right where you left off. Continue lessons, build real-world software, and level up your developer skills."
          />
        </div>

        {/* Right Column: Glassmorphic Auth Form Card */}
        <div className="flex w-full justify-center lg:justify-end">
          <AuthCardShell>
            {/* Card Header */}
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3.5 flex size-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-base font-bold shadow-sm">
                L
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                Log in
              </h1>
              <p className="mt-1.5 text-base text-white/70">
                Sign in to continue your learning journey.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/20 p-3.5 text-sm sm:text-base text-red-100">
                {error}
              </div>
            )}

            {/* Continue with Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 text-base font-semibold text-white shadow-sm transition hover:bg-white/10 hover:border-white/25 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {googleLoading ? (
                <span className="size-5 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
              ) : (
                <FcGoogle className="size-5 shrink-0" />
              )}
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="w-full border-t border-white/10" />
              <span className="absolute bg-black px-3 text-xs font-medium uppercase tracking-wider text-white/50">
                or continue with email
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/80">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-white/50" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 text-base text-white placeholder:text-base placeholder:text-white/40 outline-none transition focus:border-white/30 focus:bg-white/10 focus:ring-2 focus:ring-white/15"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/80">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-white/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-11 text-base text-white placeholder:text-base placeholder:text-white/40 outline-none transition focus:border-white/30 focus:bg-white/10 focus:ring-2 focus:ring-white/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-white/75 hover:text-white transition">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-4.5 rounded accent-white cursor-pointer"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-sm text-white/70 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? 'Hide password' : 'Show password'}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="mt-2.5 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-white text-base font-semibold text-black shadow-lg transition hover:scale-[1.015] hover:bg-white/90 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span className="size-5 animate-spin rounded-full border-2 border-black/70 border-t-transparent" />
                ) : (
                  <>
                    Log in <ArrowRight className="size-5" />
                  </>
                )}
              </button>
            </form>

            {/* Switch Page Link */}
            <p className="mt-7 text-center text-base text-white/70">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-semibold text-white underline underline-offset-4 transition hover:text-white/80"
              >
                Sign up
              </Link>
            </p>
          </AuthCardShell>
        </div>
      </div>
    </KineticGrid>
  )
}