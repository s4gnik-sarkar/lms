'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()

  // State to hold user input values
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student') // Default role is student

  // State for status messages
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    // 1. Initialize the browser Supabase client
    const supabase = createClient()

    // 2. Sign up the user with Supabase Auth (email + password)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      // We pass the role in metadata as an additional record
      options: {
        data: { role },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // 3. Once auth user is created, save the role to the 'profiles' table
    if (data?.user) {
      // Note: We use upsert so it creates the row, or updates it if a database trigger already created one.
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          role: role,
        })

      if (profileError) {
        setError('Account created, but could not save role: ' + profileError.message)
        setLoading(false)
        return
      }

      // Check if Supabase requires email confirmation
      if (data.session) {
        // Active session created immediately -> redirect straight to dashboard
        router.push('/dashboard')
        router.refresh()
      } else {
        // If email confirmation is enabled in Supabase, session is null until verified
        setMessage('Signup successful! Check your email to confirm your account, then log in.')
        setLoading(false)
      }
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Sign Up</h1>

      {error && (
        <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
          {message}
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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Choose a strong password"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Role:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
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
          }}
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p style={{ marginTop: '15px' }}>
        Already have an account? <Link href="/login" style={{ color: '#0070f3' }}>Log in here</Link>
      </p>
    </div>
  )
}
