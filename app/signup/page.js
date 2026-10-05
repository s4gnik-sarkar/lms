'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AuthCardShell from '@/components/ui/auth-card-shell'
import KineticGrid from '@/components/ui/kinetic-grid'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    async function checkExistingSession() {
      const { data: { user } } = await createClient().auth.getUser()
      if (user) { router.replace('/dashboard'); return }
      setCheckingAuth(false)
    }
    checkExistingSession()
  }, [router])

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null); setMessage(null); setLoading(true)
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { role } } })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (!data?.user) { setError('Unable to create your account.'); setLoading(false); return }
    const { error: profileError } = await supabase.from('profiles').upsert({ id: data.user.id, role })
    if (profileError) { setError(`Account created, but could not save role: ${profileError.message}`); setLoading(false); return }
    if (data.session) { router.push('/dashboard'); router.refresh() }
    else { setMessage('Signup successful! Check your email to confirm your account, then log in.'); setLoading(false) }
  }

  if (checkingAuth) return <KineticGrid className="min-h-[calc(100vh-4rem)] p-4"><div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-4 text-sm text-white/70 backdrop-blur-xl">Checking authentication session...</div></KineticGrid>

  return (
    <KineticGrid className="min-h-[calc(100vh-4rem)] p-4 sm:p-6">
      <AuthCardShell>
        <div className="mb-5 text-center"><div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-bold">L</div><h1 className="text-2xl font-bold tracking-tight">Create an account</h1><p className="mt-1 text-sm text-white/60">Start learning or teaching today.</p></div>
        {error && <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/20 p-3 text-sm text-red-100">{error}</div>}{message && <div className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-500/20 p-3 text-sm text-emerald-100">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block"><span className="sr-only">Email</span><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email address" className="h-11 w-full rounded-lg border border-transparent bg-white/5 pl-10 pr-3 text-sm text-white outline-none transition focus:border-white/25 focus:bg-white/10 focus:ring-2 focus:ring-white/10" /></div></label>
          <label className="block"><span className="sr-only">Password</span><div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Choose a strong password" className="h-11 w-full rounded-lg border border-transparent bg-white/5 pl-10 pr-10 text-sm text-white outline-none transition focus:border-white/25 focus:bg-white/10 focus:ring-2 focus:ring-white/10" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 transition hover:text-white">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></label>
          <label className="block text-sm text-white/75"><span className="mb-1.5 block text-xs">I want to</span><select value={role} onChange={(e) => setRole(e.target.value)} className="h-11 w-full cursor-pointer rounded-lg border border-transparent bg-white/5 px-3 text-sm text-white outline-none transition focus:border-white/25 focus:bg-white/10 focus:ring-2 focus:ring-white/10"><option value="student" className="bg-zinc-900">Learn as a student</option><option value="instructor" className="bg-zinc-900">Teach as an instructor</option></select></label>
          <button type="submit" disabled={loading} className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-black transition hover:scale-[1.015] hover:bg-white/90 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60">{loading ? <span className="size-4 animate-spin rounded-full border-2 border-black/70 border-t-transparent" /> : <>Create account <ArrowRight className="size-4" /></>}</button>
        </form>
        <p className="mt-5 text-center text-sm text-white/60">Already have an account? <Link href="/login" className="font-semibold text-white transition hover:text-white/70 hover:underline">Log in</Link></p>
      </AuthCardShell>
    </KineticGrid>
  )
}
