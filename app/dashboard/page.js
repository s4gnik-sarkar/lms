import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// Ensure Next.js always fetches the latest courses on every visit
export const dynamic = 'force-dynamic'

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

  // 4. Query courses based on role:
  // - Instructors see their own created courses
  // - Students see all available courses
  let courses = []
  if (role === 'instructor') {
    const { data: instructorData } = await supabase
      .from('courses')
      .select('id, title, description, created_at')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false })
    courses = instructorData || []
  } else {
    const { data: allCoursesData } = await supabase
      .from('courses')
      .select('id, title, description, created_at')
      .order('created_at', { ascending: false })
    courses = allCoursesData || []
  }

  // 5. Server Action to handle user logout
  async function logout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut() // Clears the auth cookies
    redirect('/login')           // Redirects user back to login page
  }

  return (
    <div style={{ maxWidth: '650px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        {/* Logout button triggers the logout Server Action */}
        <form action={logout}>
          <button
            type="submit"
            style={{
              padding: '8px 14px',
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

      <p style={{ fontSize: '18px', margin: '20px 0' }}>
        Hello, <strong>{user.email}</strong> ({role})
      </p>

      {/* Courses Section */}
      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0 }}>
            {role === 'instructor' ? 'My Courses' : 'Available Courses'}
          </h2>
          {/* Create course button: visible ONLY for instructors */}
          {role === 'instructor' && (
            <Link
              href="/courses/new"
              style={{
                display: 'inline-block',
                padding: '8px 14px',
                backgroundColor: '#0070f3',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              + Create course
            </Link>
          )}
        </div>

        {courses.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic', padding: '15px 0' }}>
            {role === 'instructor'
              ? 'You haven\'t created any courses yet. Click "Create course" above to get started!'
              : 'No courses available yet. Check back soon!'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {courses.map((course) => (
              <div
                key={course.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '16px',
                  backgroundColor: '#fafafa',
                }}
              >
                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>
                  {/* Link each course to its dedicated detail/lessons page */}
                  <Link
                    href={`/courses/${course.id}`}
                    style={{ color: '#0070f3', textDecoration: 'none' }}
                  >
                    {course.title} &rarr;
                  </Link>
                </h3>
                <p style={{ margin: 0, color: '#555', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                  {course.description || <em>No description provided.</em>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}