import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// Ensure Next.js always fetches the latest data on every visit
export const dynamic = 'force-dynamic'

// This is a Server Component. It renders the user dashboard tailored to their role.
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
  // - Instructors see courses they created (where instructor_id = user.id)
  // - Students see courses they are enrolled in (joined from enrollments), plus all available courses
  let instructorCourses = []
  let enrolledCourses = []
  let allAvailableCourses = []

  if (role === 'instructor') {
    const { data: instructorData } = await supabase
      .from('courses')
      .select('id, title, description, created_at')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false })
    instructorCourses = instructorData || []
  } else {
    // Query enrolled courses for the student using a Supabase join on the 'courses' table
    const { data: enrollmentData } = await supabase
      .from('enrollments')
      .select('enrolled_at, courses(id, title, description)')
      .eq('user_id', user.id)
      .order('enrolled_at', { ascending: false })

    if (enrollmentData) {
      enrolledCourses = enrollmentData
        .map((entry) => entry.courses)
        .filter(Boolean)
    }

    // Query all courses so students can browse and find new courses to enroll in
    const { data: allCoursesData } = await supabase
      .from('courses')
      .select('id, title, description, created_at')
      .order('created_at', { ascending: false })
    allAvailableCourses = allCoursesData || []
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

      {/* ============================================================== */}
      {/* INSTRUCTOR VIEW: Shows courses they created + Create Course btn */}
      {/* ============================================================== */}
      {role === 'instructor' && (
        <div style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: 0 }}>My Courses</h2>
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
          </div>

          {instructorCourses.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic', padding: '15px 0' }}>
              You haven&apos;t created any courses yet. Click &quot;Create course&quot; above to get started!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {instructorCourses.map((course) => (
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
      )}

      {/* ============================================================== */}
      {/* STUDENT VIEW: Shows enrolled "My courses" + "Available courses" */}
      {/* ============================================================== */}
      {role !== 'instructor' && (
        <div style={{ marginTop: '30px' }}>
          {/* Section 1: Enrolled Courses ("My courses") */}
          <h2 style={{ margin: '0 0 15px 0' }}>My Courses</h2>
          {enrolledCourses.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic', marginBottom: '30px' }}>
              You are not enrolled in any courses yet. Browse the available courses below to enroll!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '35px' }}>
              {enrolledCourses.map((course) => (
                <div
                  key={course.id}
                  style={{
                    border: '1px solid #c8e6c9',
                    borderRadius: '6px',
                    padding: '16px',
                    backgroundColor: '#f1f8e9',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>
                      <Link
                        href={`/courses/${course.id}`}
                        style={{ color: '#2e7d32', textDecoration: 'none' }}
                      >
                        {course.title} &rarr;
                      </Link>
                    </h3>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#2e7d32', backgroundColor: '#e8f5e9', padding: '3px 8px', borderRadius: '12px' }}>
                      Enrolled
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#555', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                    {course.description || <em>No description provided.</em>}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Section 2: Browse All Available Courses */}
          <h2 style={{ margin: '0 0 15px 0' }}>Available Courses</h2>
          {allAvailableCourses.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No courses available right now.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {allAvailableCourses.map((course) => (
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
      )}
    </div>
  )
}