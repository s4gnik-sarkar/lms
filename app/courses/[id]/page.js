import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ConfirmButton } from '@/components/confirm-button'
import { Lock, BookOpen, CheckCircle, ArrowRight, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

/**
 * Course Details Page
 *
 * Requirements:
 * - Publicly viewable by logged-out visitors.
 * - Logged-out visitor: Shows course info, instructor name, and "Log in to enroll" button
 *   pointing to `/login?next=/courses/[id]`. Lesson content is hidden/locked.
 * - Enrolled student: Shows lesson contents, progress status, and unenroll option.
 * - Unenrolled student: Shows "Enroll in this course" button.
 * - Instructor (course owner): Shows lesson manager and "Delete course" button.
 */
export default async function CourseDetailPage({ params }) {
  const { id } = await params

  const supabase = await createClient()

  // 1. Retrieve authenticated user (if any)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 2. Query user role from profiles if logged in
  let userRole = 'guest'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    userRole = profile?.role || 'student'
  }

  // 3. Fetch course information including the instructor's public profile
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(`
      *,
      profiles:instructor_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('id', id)
    .single()

  // If the course doesn't exist, redirect back to courses catalog
  if (!course || courseError) {
    redirect('/courses')
  }

  // Check if current user is the course instructor
  const isInstructor = userRole === 'instructor' && course.instructor_id === user?.id

  // 4. Check enrollment status (only applies to logged-in students)
  let isEnrolled = false
  if (user && userRole === 'student') {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', id)
      .maybeSingle()

    isEnrolled = !!enrollment
  }

  // 5. Fetch lessons belonging to this course
  // Logged-in users who are enrolled or instructors get full content.
  // Guests and unenrolled users get titles & positions only (content hidden).
  const canAccessContent = Boolean(user && (isEnrolled || isInstructor))

  const { data: lessonsData } = await supabase
    .from('lessons')
    .select(canAccessContent ? '*' : 'id, title, position')
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
      redirect(`/login?next=/courses/${id}`)
    }

    const { error: enrollError } = await supabase.from('enrollments').insert({
      user_id: user.id,
      course_id: id,
    })

    if (enrollError && enrollError.code !== '23505') {
      console.error('Enrollment failed:', enrollError.message)
      throw new Error('Enrollment failed: ' + enrollError.message)
    }

    revalidatePath(`/courses/${id}`)
    revalidatePath('/dashboard')
    revalidatePath('/my-courses')
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
    revalidatePath('/my-courses')
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

    const { data: targetCourse } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', id)
      .single()

    if (!targetCourse || targetCourse.instructor_id !== user.id) {
      throw new Error('Unauthorized: You can only delete your own courses.')
    }

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
    revalidatePath('/courses')
    revalidatePath('/my-courses')
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

    const { data: currentCourse } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', id)
      .single()

    if (currentCourse?.instructor_id !== user.id) {
      throw new Error('Unauthorized: Only the course instructor can add lessons.')
    }

    const { data: existingLessons } = await supabase
      .from('lessons')
      .select('position')
      .eq('course_id', id)
      .order('position', { ascending: false })
      .limit(1)

    const nextPosition = (existingLessons?.[0]?.position || 0) + 1

    const { error: insertError } = await supabase.from('lessons').insert({
      course_id: id,
      title: title.trim(),
      content: content ? content.trim() : '',
      position: nextPosition,
    })

    if (insertError) {
      console.error('Failed to add lesson:', insertError.message)
      throw new Error('Failed to add lesson: ' + insertError.message)
    }

    revalidatePath(`/courses/${id}`)
    redirect(`/courses/${id}`)
  }

  const instructorName = course.profiles?.full_name || 'Verified Instructor'

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Back Navigation Link */}
      <div className="mb-6">
        <Link
          href={user ? '/my-courses' : '/courses'}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to {user ? 'My Courses' : 'All Courses'}
        </Link>
      </div>

      {/* Course Header Banner */}
      <div className="rounded-3xl border border-border/60 bg-card p-6 sm:p-9 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                <BookOpen className="size-3.5" />
                {lessons.length} {lessons.length === 1 ? 'Lesson' : 'Lessons'}
              </span>

              {isEnrolled && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle className="size-3.5" />
                  Enrolled
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              {course.title}
            </h1>

            {/* Instructor credit */}
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                {instructorName[0]?.toUpperCase() || <User className="size-3" />}
              </div>
              <span>
                Taught by <strong className="text-foreground">{instructorName}</strong>
              </span>
            </div>
          </div>

          {/* Instructor Delete Course Button */}
          {isInstructor && (
            <div className="shrink-0">
              <ConfirmButton
                action={deleteCourse}
                buttonText="Delete course"
                confirmMessage="This will delete all lessons and student progress. Are you sure?"
                variant="destructive"
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Course Description */}
        <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {course.description || 'No description provided.'}
        </p>

        {/* Enrollment Action Bar */}
        <div className="mt-8 pt-6 border-t border-border/50 flex flex-wrap items-center justify-between gap-4">
          {/* 1. Logged-out visitor: Prompt to log in */}
          {!user && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full bg-muted/40 p-4 rounded-2xl border border-border/60">
              <div>
                <p className="font-semibold text-foreground text-sm">
                  Ready to start learning?
                </p>
                <p className="text-xs text-muted-foreground">
                  Sign in or create an account to unlock all lessons and track your progress.
                </p>
              </div>
              <Button asChild className="rounded-full gap-2 shrink-0 font-semibold">
                <Link href={`/login?next=/courses/${id}`}>
                  Log in to enroll
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          )}

          {/* 2. Logged-in Student: Enrolled or Enroll */}
          {user && userRole === 'student' && (
            <div className="w-full">
              {isEnrolled ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                    <CheckCircle className="size-5" />
                    <span>You are enrolled in this course</span>
                  </div>
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
                  <Button type="submit" size="lg" className="rounded-full gap-2 font-semibold">
                    Enroll in this course
                    <ArrowRight className="size-4" />
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* LESSONS SECTION                                                    */}
      {/* ================================================================== */}
      <div className="mt-10 sm:mt-12">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Course Curriculum</h2>

        {lessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center text-muted-foreground text-sm">
            No lessons added to this course yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-base sm:text-lg">
                    Lesson {index + 1}: {lesson.title}
                  </h3>

                  {!canAccessContent && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
                      <Lock className="size-3" />
                      Locked
                    </span>
                  )}
                </div>

                {/* Lesson content: Shown ONLY if enrolled student or instructor */}
                {canAccessContent ? (
                  <p className="mt-3 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {lesson.content || <em className="text-muted-foreground">No lesson content yet.</em>}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Enroll in the course to view lesson material and exercises.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Guest Lock Notice */}
        {!canAccessContent && lessons.length > 0 && (
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center text-sm text-muted-foreground">
            Want to access these lessons?{' '}
            <Link
              href={user ? `/courses/${id}` : `/login?next=/courses/${id}`}
              className="font-semibold text-primary underline underline-offset-4"
            >
              {user ? 'Enroll now' : 'Log in to enroll'}
            </Link>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* INSTRUCTOR: ADD LESSON FORM                                        */}
      {/* ================================================================== */}
      {isInstructor && (
        <div className="mt-12 pt-8 border-t border-border/60">
          <h2 className="text-xl font-bold tracking-tight mb-4">Add a New Lesson</h2>
          <form
            action={addLesson}
            className="flex flex-col gap-4 bg-muted/30 p-6 rounded-2xl border border-border/60"
          >
            <div className="space-y-1.5">
              <label htmlFor="title" className="block text-sm font-semibold">
                Lesson Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="e.g. Setting up your Next.js project"
                className="h-10 w-full rounded-xl border border-input/60 bg-background px-3.5 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="content" className="block text-sm font-semibold">
                Lesson Content
              </label>
              <textarea
                id="content"
                name="content"
                rows={4}
                placeholder="Write lesson guides, instructions, or code snippets here..."
                className="w-full rounded-xl border border-input/60 bg-background p-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <Button type="submit" className="rounded-full font-semibold">
                Add Lesson
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}