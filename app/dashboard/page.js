import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ConfirmButton } from '@/components/confirm-button'
import { getStudentDashboardData } from '@/lib/dashboard-data'
import { StudentDashboard } from '@/components/dashboard/student-dashboard'

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
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  // Fallback if the profile row hasn't populated yet
  const role = profile?.role || 'No role found'

  // 4. Query courses based on role:
  // - Instructors see courses they created (where instructor_id = user.id)
  // - Students see courses they are enrolled in (joined from enrollments), plus all available courses
  let instructorCourses = []
  let studentDashboardData = null

  if (role === 'instructor') {
    const { data: instructorData } = await supabase
      .from('courses')
      .select('id, title, description, created_at')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false })
    instructorCourses = instructorData || []
  } else {
    studentDashboardData = await getStudentDashboardData(supabase, user.id)
  }

  // 5. Server Action to delete a course directly from the dashboard (Instructor ownership verified)
  async function deleteCourseFromDashboard(courseId) {
    'use server'

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    // Server-side ownership verification: verify the user is the course owner
    const { data: targetCourse } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', courseId)
      .single()

    if (!targetCourse || targetCourse.instructor_id !== user.id) {
      throw new Error('Unauthorized: You can only delete your own courses.')
    }

    // Delete the course (cascades to lessons, enrollments, and progress via foreign keys)
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
      .eq('instructor_id', user.id)

    if (deleteError) {
      console.error('Failed to delete course:', deleteError.message)
      throw new Error('Failed to delete course: ' + deleteError.message)
    }

    revalidatePath('/dashboard')
    redirect('/dashboard')
  }

  // 6. Server Action to handle user logout
  async function logout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut() // Clears the auth cookies
    redirect('/login')           // Redirects user back to login page
  }

  if (studentDashboardData) {
    return (
      <StudentDashboard
        displayName={studentDashboardData.profile?.full_name || user.email?.split('@')[0] || 'Learner'}
        subscription={studentDashboardData.subscription}
        courses={studentDashboardData.courses}
        continueCourse={studentDashboardData.continueCourse}
        recommendations={studentDashboardData.recommendations}
        savedCourses={studentDashboardData.savedCourses}
        savedCourseIds={studentDashboardData.savedCourseIds}
      />
    )
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
      {/* INSTRUCTOR VIEW: Shows courses they created + Delete button    */}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>
                      <Link
                        href={`/courses/${course.id}`}
                        style={{ color: '#0070f3', textDecoration: 'none' }}
                      >
                        {course.title} &rarr;
                      </Link>
                    </h3>

                    {/* Delete course button with confirmation */}
                    <ConfirmButton
                      action={deleteCourseFromDashboard.bind(null, course.id)}
                      buttonText="Delete course"
                      confirmMessage="This will delete all lessons and student progress. Are you sure?"
                      variant="destructive"
                      size="sm"
                    />
                  </div>
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