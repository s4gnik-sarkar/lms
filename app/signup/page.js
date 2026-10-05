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

const SIGNUP_PHRASES = [
  'Learn to code. Build real things.',
  'From HTML to the cloud.',
  'Master JavaScript, React & Python.',
  'Ship your first IoT project.',
  'Your skills. Your pace. Your future.',
]

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    async function checkExistingSession() {
      const {
        data: { user },
      } = await createClient().auth.getUser()
      if (user) {
        router.replace('/dashboard')
        return
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

  async function handleGoogleSignup() {
    setError(null)
    setMessage(null)
    setGoogleLoading(true)
    try {
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=${encodeURIComponent(role)}`,
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
    setMessage(null)
    setLoading(true)
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }
    if (!data?.user) {
      setError('Unable to create your account.')
      setLoading(false)
      return
    }
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: data.user.id, role })
    if (profileError) {
      setError(`Account created, but could not save role: ${profileError.message}`)
      setLoading(false)
      return
    }
    if (data.session) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setMessage('Signup successful! Check your email to confirm your account, then log in.')
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
            phrases={SIGNUP_PHRASES}
            badge="✦ Start Your Journey"
            subtitle="Join a community of forward-thinking engineers. Build real-world portfolio projects, master full-stack development, and accelerate your career."
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
                Create account
              </h1>
              <p className="mt-1.5 text-base text-white/70">
                Start learning or teaching today.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/20 p-3.5 text-sm sm:text-base text-red-100">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/20 p-3.5 text-sm sm:text-base text-emerald-100">
                {message}
              </div>
            )}

            {/* Role Selection (Applies to both Google and Email signups) */}
            <div className="mb-4 space-y-1.5">
              <label className="block text-sm font-medium text-white/80">
                I want to
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading || googleLoading}
                className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition focus:border-white/30 focus:bg-white/10 focus:ring-2 focus:ring-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="student" className="bg-zinc-900 text-white">
                  Learn as a student
                </option>
                <option value="instructor" className="bg-zinc-900 text-white">
                  Teach as an instructor
                </option>
              </select>
            </div>

            {/* Continue with Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignup}
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
                or sign up with email
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
                    placeholder="Choose a strong password"
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
                    Create account <ArrowRight className="size-5" />
                  </>
                )}
              </button>
            </form>

            {/* Switch Page Link */}
            <p className="mt-7 text-center text-base text-white/70">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-white underline underline-offset-4 transition hover:text-white/80"
              >
                Log in
              </Link>
            </p>
          </AuthCardShell>
        </div>
      </div>
    </KineticGrid>
  )
}