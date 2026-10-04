import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// This is a Server Component. It verifies the user's role on the server before rendering the page.
export default async function NewCoursePage() {
  const supabase = await createClient()

  // 1. Check if the user is authenticated
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user || userError) {
    redirect('/login')
  }

  // 2. Fetch the user's role from the 'profiles' table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // 3. Authorization check: Only instructors can access this page
  // Students or users without instructor role are redirected to the dashboard
  if (profile?.role !== 'instructor') {
    redirect('/dashboard')
  }

  // 4. Server Action to handle form submission directly on the server
  async function createCourse(formData) {
    'use server'

    const title = formData.get('title')
    const description = formData.get('description')

    // Basic validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw new Error('Course title is required.')
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    // Insert new course into the 'courses' table using column names from supabase/schema.sql
    const { error: insertError } = await supabase.from('courses').insert({
      instructor_id: user.id,
      title: title.trim(),
      description: description ? description.trim() : '',
    })

    if (insertError) {
      console.error('Failed to create course:', insertError.message)
      throw new Error('Database error: ' + insertError.message)
    }

    // Redirect to dashboard after successful course creation
    redirect('/dashboard')
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <p style={{ marginBottom: '20px' }}>
        <Link href="/dashboard" style={{ color: '#0070f3', textDecoration: 'none' }}>
          &larr; Back to Dashboard
        </Link>
      </p>

      <h1>Create a New Course</h1>
      <p style={{ color: '#666', marginBottom: '25px' }}>
        Fill out the details below to create your course.
      </p>

      {/* The form calls the createCourse Server Action on submit */}
      <form action={createCourse} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label htmlFor="title" style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>
            Course Title *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="e.g. Introduction to Web Development"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label htmlFor="description" style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            placeholder="What will students learn in this course?"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
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
            padding: '12px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Create Course
        </button>
      </form>
    </div>
  )
}