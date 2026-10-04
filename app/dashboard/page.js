import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// This is a Server Component. It runs securely on the server before sending HTML to the browser.
export default async function DashboardPage() {
  // 1. Initialize Supabase client configured for the server
  const supabase = await createClient()

  // 2. Retrieve the currently authenticated user from session cookies
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  // If no user is logged in, redirect them to the login page immediately
  if (!user || userError) {
    redirect('/login')
  }

  // 3. Query the user's role from the 'profiles' database table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Fallback if the profile row hasn't populated yet
  const role = profile?.role || 'No role found'

  // 4. Server Action to handle user logout
  async function logout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut() // Clears the auth cookies
    redirect('/login')           // Redirects user back to login page
  }

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Dashboard</h1>

      <p style={{ fontSize: '18px', margin: '20px 0' }}>
        Hello, <strong>{user.email}</strong> ({role})
      </p>

      {/* Logout button triggers the logout Server Action */}
      <form action={logout}>
        <button
          type="submit"
          style={{
            padding: '10px 18px',
            backgroundColor: '#e53e3e',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Log out
        </button>
      </form>
    </div>
  )
}
