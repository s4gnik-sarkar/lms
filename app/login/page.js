'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()

  // State to hold input values
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // State for toggling password visibility and remembering email
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // State for error feedback and loading state
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // On component mount: Check if an email was previously saved in localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('lms_remembered_email')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // 1. Handle "Remember me":
      // If checked, store email in localStorage so it pre-fills next time.
      // If unchecked, remove it from localStorage.
      // NOTE: We only store the email, NEVER the password, for security!
      if (rememberMe) {
        localStorage.setItem('lms_remembered_email', email)
      } else {
        localStorage.removeItem('lms_remembered_email')
      }

      // 2. Initialize browser Supabase client
      const supabase = createClient()

      // 3. Sign in with email and password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        if (signInError.message.toLowerCase().includes('invalid login credentials')) {
          setError('Incorrect email or password. Please double-check your credentials.')
        } else {
          setError(signInError.message)
        }
        setLoading(false)
        return
      }

      // 4. On success, navigate to /dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Connection error: ' + (err.message || 'Unable to connect to Supabase.'))
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Log In</h1>

      {error && (
        <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password:</label>
          <input
            // Dynamic input type: 'text' reveals the password, 'password' masks it with dots
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Your password"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        {/* Options Row: Show Password checkbox & Remember Me checkbox */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#444' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            Show password
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p style={{ marginTop: '15px' }}>
        Don&apos;t have an account? <Link href="/signup" style={{ color: '#0070f3' }}>Sign up here</Link>
      </p>
    </div>
  )
}