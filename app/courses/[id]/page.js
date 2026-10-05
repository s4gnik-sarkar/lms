import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ConfirmButton } from '@/components/confirm-button'

// Ensure fresh data is fetched on every visit
export const dynamic = 'force-dynamic'

// This Server Component renders course details, lessons, enrollment, and course management.
export default async function CourseDetailPage({ params }) {
  // In modern Next.js, dynamic route params must be awaited
  const { id } = await params

  const supabase = await createClient()

  // 1. Authenticate the user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user || userError) {
    redirect('/login')
  }

  // 2. Fetch the user's role from profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role || 'student'

  // 3. Fetch course information from the 'courses' table
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  // If the course doesn't exist, redirect back to the dashboard
  if (!course || courseError) {
    redirect('/dashboard')
  }

  // Check if the current user is the instructor who owns this course
  const isInstructor = userRole === 'instructor' && course.instructor_id === user.id

  // 4. Check enrollment status (only relevant for students)
  let isEnrolled = false
  if (userRole === 'student') {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', id)
      .maybeSingle()

    isEnrolled = !!enrollment
  }

  // 5. Fetch all lessons belonging to this course
  const { data: lessonsData } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', id)
    .order('position', { ascending: true })

  const lessons = lessonsData || []

  // 6. Server Action: Student Enrollment
  async function enrollInCourse() {
    'use server'

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    const { error: enrollError } = await supabase.from('enrollments').insert({
      user_id: user.id,
      course_id: id,
    })

    if (enrollError) {
      if (enrollError.code === '23505') {
        console.log('User is already enrolled in this course.')
      } else {
        console.error('Enrollment failed:', enrollError.message)
        throw new Error('Enrollment failed: ' + enrollError.message)
      }
    }

    revalidatePath(`/courses/${id}`)
    revalidatePath('/dashboard')
    redirect(`/courses/${id}`)
  }

  // 7. Server Action: Student Unenrollment
  async function unenrollFromCourse() {
    'use server'

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    // A. Delete any lesson_progress for lessons in this course
    const { data: courseLessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', id)

    if (courseLessons && courseLessons.length > 0) {
      const lessonIds = courseLessons.map((l) => l.id)
      await supabase
        .from('lesson_progress')
        .delete()
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds)
    }

    // B. Delete the student's enrollment record
    const { error: unenrollError } = await supabase
      .from('enrollments')
      .delete()
      .eq('user_id', user.id)
      .eq('course_id', id)

    if (unenrollError) {
      console.error('Failed to unenroll:', unenrollError.message)
      throw new Error('Failed to unenroll: ' + unenrollError.message)
    }

    revalidatePath(`/courses/${id}`)
    revalidatePath('/dashboard')
    redirect(`/courses/${id}`)
  }

  // 8. Server Action: Delete Course (Instructor ownership verified)
  async function deleteCourse() {
    'use server'

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    // Verify ownership on the server: only the course instructor can delete it
    const { data: targetCourse } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', id)
      .single()

    if (!targetCourse || targetCourse.instructor_id !== user.id) {
      throw new Error('Unauthorized: You can only delete your own courses.')
    }

    // Delete the course (cascades to lessons, enrollments, and progress via foreign keys)
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)
      .eq('instructor_id', user.id)

    if (deleteError) {
      console.error('Failed to delete course:', deleteError.message)
      throw new Error('Failed to delete course: ' + deleteError.message)
    }

    revalidatePath('/dashboard')
    redirect('/dashboard')
  }

  // 9. Server Action: Add a New Lesson (Instructors only)
  async function addLesson(formData) {
    'use server'

    const title = formData.get('title')
    const content = formData.get('content')

    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw new Error('Lesson title is required.')
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    // Verify instructor ownership before inserting
    const { data: currentCourse } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', id)
      .single()

    if (currentCourse?.instructor_id !== user.id) {
      throw new Error('Unauthorized: Only the course instructor can add lessons.')
    }

    const { error: insertError } = await supabase.from('lessons').insert({
      course_id: id,
      title: title.trim(),
      content: content ? content.trim() : '',
    })

    if (insertError) {
      console.error('Error inserting lesson:', insertError.message)
      throw new Error('Database error: ' + insertError.message)
    }

    revalidatePath(`/courses/${id}`)
    redirect(`/courses/${id}`)
  }

  return (
    <div style={{ maxWidth: '650px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <p style={{ marginBottom: '20px' }}>
        <Link href="/dashboard" style={{ color: '#0070f3', textDecoration: 'none' }}>
          &larr; Back to Dashboard
        </Link>
      </p>

      {/* Course Header with optional Instructor Delete Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', marginBottom: '8px' }}>
        <h1 style={{ margin: 0 }}>{course.title}</h1>
        {isInstructor && (
          <ConfirmButton
            action={deleteCourse}
            buttonText="Delete course"
            confirmMessage="This will delete all lessons and student progress. Are you sure?"
            variant="destructive"
            size="sm"
          />
        )}
      </div>

      <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.5', marginTop: 0 }}>
        {course.description || <em>No description provided.</em>}
      </p>

      {/* Student Enrollment Section:
          - Only visible to students.
          - If enrolled: shows "✓ Enrolled" badge AND "Unenroll" button with confirmation.
          - If not enrolled: shows "Enroll in this course" button. */}
      {userRole === 'student' && (
        <div style={{ marginTop: '20px', marginBottom: '10px' }}>
          {isEnrolled ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: '#e6f4ea',
                  color: '#137333',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  border: '1px solid #ceead6',
                }}
              >
                ✓ Enrolled
              </span>
              <ConfirmButton
                action={unenrollFromCourse}
                buttonText="Unenroll"
                confirmMessage="Are you sure you want to unenroll from this course?"
                variant="outline"
                size="sm"
              />
            </div>
          ) : (
            <form action={enrollInCourse}>
              <button
                type="submit"
                style={{
                  padding: '10px 22px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Enroll in this course
              </button>
            </form>
          )}
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '30px 0' }} />

      {/* Lessons List Section */}
      <h2>Lessons</h2>
      {lessons.length === 0 ? (
        <p style={{ color: '#777', fontStyle: 'italic' }}>No lessons added to this course yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '35px' }}>
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '6px',
                padding: '16px',
                backgroundColor: '#fafafa',
              }}
            >
              <h3 style={{ margin: '0 0 8px 0', fontSize: '17px' }}>
                Lesson {index + 1}: {lesson.title}
              </h3>
              <p style={{ margin: 0, color: '#444', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                {lesson.content || <em>No lesson content yet.</em>}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* "Add Lesson" Form: Rendered ONLY if the user is the course instructor. */}
      {isInstructor && (
        <div style={{ marginTop: '40px', borderTop: '2px solid #eee', paddingTop: '25px' }}>
          <h3>Add a New Lesson</h3>
          <form action={addLesson} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label htmlFor="title" style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                Lesson Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="e.g. Setting up your Environment"
                style={{
                  width: '100%',
                  padding: '9px',
                  fontSize: '15px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label htmlFor="content" style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                Lesson Content
              </label>
              <textarea
                id="content"
                name="content"
                rows={4}
                placeholder="Write the lesson content, instructions, or notes here..."
                style={{
                  width: '100%',
                  padding: '9px',
                  fontSize: '15px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  fontFamily: 'sans-serif',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: '10px 18px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              Add Lesson
            </button>
          </form>
        </div>
      )}
    </div>
  )
}