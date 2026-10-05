'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AuthCardShell from '@/components/ui/auth-card-shell'
import KineticGrid from '@/components/ui/kinetic-grid'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    async function checkExistingSession() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.replace('/dashboard')
        return
      }
      const savedEmail = localStorage.getItem('lms_remembered_email')
      if (savedEmail) {
        setEmail(savedEmail)
        setRememberMe(true)
      }
      setCheckingAuth(false)
    }
    checkExistingSession()
  }, [router])

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (rememberMe) localStorage.setItem('lms_remembered_email', email)
      else localStorage.removeItem('lms_remembered_email')
      const { error: signInError } = await createClient().auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message.toLowerCase().includes('invalid login credentials') ? 'Incorrect email or password. Please double-check your credentials.' : signInError.message)
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

  if (checkingAuth) return <KineticGrid className="min-h-[calc(100vh-4rem)] p-4"><div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-4 text-sm text-white/70 backdrop-blur-xl">Checking authentication session...</div></KineticGrid>

  return (
    <KineticGrid className="min-h-[calc(100vh-4rem)] p-4 sm:p-6">
      <AuthCardShell>
        <div className="mb-6 text-center"><div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-bold">L</div><h1 className="text-2xl font-bold tracking-tight">Welcome back</h1><p className="mt-1 text-sm text-white/60">Sign in to continue learning.</p></div>
        {error && <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/20 p-3 text-sm text-red-100">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block"><span className="sr-only">Email</span><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email address" className="h-11 w-full rounded-lg border border-transparent bg-white/5 pl-10 pr-3 text-sm text-white outline-none transition focus:border-white/25 focus:bg-white/10 focus:ring-2 focus:ring-white/10" /></div></label>
          <label className="block"><span className="sr-only">Password</span><div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" className="h-11 w-full rounded-lg border border-transparent bg-white/5 pl-10 pr-10 text-sm text-white outline-none transition focus:border-white/25 focus:bg-white/10 focus:ring-2 focus:ring-white/10" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 transition hover:text-white">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></label>
          <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs text-white/65"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="size-4 accent-white" />Remember me</label>
          <button type="submit" disabled={loading} className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-black transition hover:scale-[1.015] hover:bg-white/90 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60">{loading ? <span className="size-4 animate-spin rounded-full border-2 border-black/70 border-t-transparent" /> : <>Log in <ArrowRight className="size-4" /></>}</button>
        </form>
        <p className="mt-6 text-center text-sm text-white/60">Don&apos;t have an account? <Link href="/signup" className="font-semibold text-white transition hover:text-white/70 hover:underline">Sign up</Link></p>
      </AuthCardShell>
    </KineticGrid>
  )
}
