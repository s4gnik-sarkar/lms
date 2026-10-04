import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// Ensure fresh data is fetched on every visit
export const dynamic = 'force-dynamic'

// This Server Component renders the course details and its lessons.
// Students see the lessons only; instructors also see the "Add Lesson" form.
export default async function CourseDetailPage({ params }) {
  // In Next.js 15+, dynamic route params must be awaited
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

  // 4. Fetch all lessons belonging to this course
  const { data: lessonsData } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', id)
    .order('position', { ascending: true })

  const lessons = lessonsData || []

  // 5. Server Action to add a new lesson (only instructors can execute this)
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

    // Insert into 'lessons' table
    const { error: insertError } = await supabase.from('lessons').insert({
      course_id: id,
      title: title.trim(),
      content: content ? content.trim() : '',
    })

    if (insertError) {
      console.error('Error inserting lesson:', insertError.message)
      throw new Error('Database error: ' + insertError.message)
    }

    // Refresh the course page to show the newly added lesson
    redirect(`/courses/${id}`)
  }

  return (
    <div style={{ maxWidth: '650px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <p style={{ marginBottom: '20px' }}>
        <Link href="/dashboard" style={{ color: '#0070f3', textDecoration: 'none' }}>
          &larr; Back to Dashboard
        </Link>
      </p>

      {/* Course Header */}
      <h1 style={{ marginBottom: '8px' }}>{course.title}</h1>
      <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.5', marginTop: 0 }}>
        {course.description || <em>No description provided.</em>}
      </p>

      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '30px 0' }} />

      {/* Lessons List Section (visible to BOTH students and instructors) */}
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

      {/* "Add Lesson" Form: Rendered ONLY if the user is the course instructor.
          For students, this entire section is omitted from the page! */}
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