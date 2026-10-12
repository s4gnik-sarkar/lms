'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function resumeLesson(courseId, lessonId) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('You must be signed in to resume a lesson.')
  }

  const [{ data: lesson, error: lessonError }, { data: enrollment, error: enrollmentError }] =
    await Promise.all([
      supabase
        .from('lessons')
        .select('id')
        .eq('id', lessonId)
        .eq('course_id', courseId)
        .maybeSingle(),
      supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle(),
    ])

  if (lessonError || enrollmentError) {
    throw new Error(
      `Unable to resume lesson: ${lessonError?.message || enrollmentError?.message}`
    )
  }
  if (!lesson || !enrollment) {
    throw new Error('You must be enrolled in this course to resume the lesson.')
  }

  const { error: progressError } = await supabase.from('lesson_progress').upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      is_completed: false,
      completed_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lesson_id' }
  )

  if (progressError) {
    throw new Error(`Unable to record lesson activity: ${progressError.message}`)
  }

  revalidatePath('/dashboard')
  redirect(`/courses/${courseId}#lesson-${lessonId}`)
}

export async function setSavedCourse(courseId, shouldSave) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('You must be signed in to save courses.')
  }

  if (shouldSave) {
    const { error } = await supabase
      .from('saved_courses')
      .upsert({ user_id: user.id, course_id: courseId }, { onConflict: 'user_id,course_id' })

    if (error) {
      throw new Error(`Unable to save course: ${error.message}`)
    }
  } else {
    const { error } = await supabase
      .from('saved_courses')
      .delete()
      .eq('user_id', user.id)
      .eq('course_id', courseId)

    if (error) {
      throw new Error(`Unable to remove saved course: ${error.message}`)
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/my-courses')
}
