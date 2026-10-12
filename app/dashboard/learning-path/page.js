import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Check, Circle, LockKeyhole, Play, Target } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function getStepStatus(step, lessonCounts, completedCounts, enrolledCourseIds, activeLessonIds) {
  const totalLessons = lessonCounts.get(step.course_id) || 0
  const completedLessons = completedCounts.get(step.course_id) || 0

  if (step.course_id && totalLessons > 0 && completedLessons === totalLessons) {
    return 'completed'
  }

  if (
    step.course_id &&
    (enrolledCourseIds.has(step.course_id) ||
      (activeLessonIds.get(step.course_id) || 0) > 0)
  ) {
    return 'in-progress'
  }

  return 'upcoming'
}

function RoadmapStep({ step, status, isCurrent, isLast }) {
  const Icon = status === 'completed' ? Check : status === 'upcoming' ? LockKeyhole : Circle
  const statusText =
    status === 'completed'
      ? 'Completed'
      : status === 'in-progress'
        ? 'In progress'
        : 'Locked / Upcoming'
  const href = step.course_id ? `/courses/${step.course_id}` : '/courses'

  return (
    <li
      className="learning-path-step relative grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-5"
      style={{ animationDelay: `${step.position * 70}ms` }}
    >
      <div className="relative flex justify-center">
        {!isLast && (
          <span
            aria-hidden="true"
            className={`absolute bottom-0 top-12 w-0.5 ${
              status === 'completed' ? 'bg-primary' : 'bg-border'
            }`}
          />
        )}
        <span
          className={`relative z-10 mt-2 flex size-11 items-center justify-center rounded-full border-4 border-background shadow-sm sm:size-12 ${
            status === 'completed'
              ? 'bg-emerald-500 text-white'
              : status === 'in-progress'
                ? 'learning-path-current-node bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
          }`}
          aria-label={statusText}
        >
          <Icon className={status === 'in-progress' ? 'size-5 fill-current/20' : 'size-5'} />
        </span>
      </div>

      <article
        className={`mb-5 min-w-0 rounded-2xl border p-4 shadow-sm sm:mb-6 sm:p-6 ${
          isCurrent
            ? 'border-primary/40 bg-primary/[0.04] shadow-primary/5'
            : 'border-border/70 bg-card'
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Step {step.position}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : status === 'in-progress'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {statusText}
              </span>
            </div>
            <h2 className="mt-2 text-lg font-bold sm:text-xl">{step.title}</h2>
            {step.description && (
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                {step.description}
              </p>
            )}
            {step.courses?.title ? (
              <p className="mt-3 text-sm">
                Course: <span className="font-semibold">{step.courses.title}</span>
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Course content will be linked here when it becomes available.
              </p>
            )}
          </div>
          {isCurrent && (
            <Link
              href={href}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Play className="size-4 fill-current" />
              Continue
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </article>
    </li>
  )
}

export default async function LearningPathPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login?next=/dashboard/learning-path')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    throw new Error(`Unable to load your profile: ${profileError.message}`)
  }
  if (profile?.role === 'instructor') {
    redirect('/dashboard')
  }

  const { data: path, error: pathError } = await supabase
    .from('learning_paths')
    .select('id, title, description')
    .eq('title', 'Robotics Learner')
    .maybeSingle()

  if (pathError) {
    throw new Error(`Unable to load your learning path: ${pathError.message}`)
  }

  let steps = []
  if (path) {
    const { data, error } = await supabase
      .from('path_steps')
      .select('id, path_id, position, title, description, course_id, courses (title)')
      .eq('path_id', path.id)
      .order('position', { ascending: true })

    if (error) {
      throw new Error(`Unable to load learning path steps: ${error.message}`)
    }
    steps = data || []
  }

  const courseIds = [...new Set(steps.map((step) => step.course_id).filter(Boolean))]
  let lessonCounts = new Map()
  let completedCounts = new Map()
  let activeLessonIds = new Map()
  let enrolledCourseIds = new Set()

  if (courseIds.length) {
    const [
      { data: lessonRows, error: lessonsError },
      { data: enrollmentRows, error: enrollmentError },
    ] = await Promise.all([
      supabase.from('lessons').select('id, course_id').in('course_id', courseIds),
      supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user.id)
        .in('course_id', courseIds),
    ])

    if (lessonsError || enrollmentError) {
      throw new Error(
        `Unable to load learning progress: ${lessonsError?.message || enrollmentError?.message}`
      )
    }

    const lessons = lessonRows || []
    lessonCounts = lessons.reduce((counts, lesson) => {
      counts.set(lesson.course_id, (counts.get(lesson.course_id) || 0) + 1)
      return counts
    }, new Map())
    enrolledCourseIds = new Set((enrollmentRows || []).map((row) => row.course_id))

    const lessonIds = lessons.map((lesson) => lesson.id)
    if (lessonIds.length) {
      const { data: progressRows, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id, is_completed')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds)

      if (progressError) {
        throw new Error(`Unable to load learning progress: ${progressError.message}`)
      }

      const courseByLesson = new Map(lessons.map((lesson) => [lesson.id, lesson.course_id]))
      for (const row of progressRows || []) {
        const courseId = courseByLesson.get(row.lesson_id)
        if (!courseId) continue
        activeLessonIds.set(courseId, (activeLessonIds.get(courseId) || 0) + 1)
        if (row.is_completed) {
          completedCounts.set(courseId, (completedCounts.get(courseId) || 0) + 1)
        }
      }
    }
  }

  const stepsWithStatus = steps.map((step) => ({
    ...step,
    status: getStepStatus(
      step,
      lessonCounts,
      completedCounts,
      enrolledCourseIds,
      activeLessonIds
    ),
  }))
  const completedStepCount = stepsWithStatus.filter((step) => step.status === 'completed').length
  const completionPercent = stepsWithStatus.length
    ? Math.round((completedStepCount / stepsWithStatus.length) * 100)
    : 0
  const currentStep =
    stepsWithStatus.find((step) => step.status === 'in-progress') ||
    stepsWithStatus.find((step) => step.status !== 'completed')

  return (
    <DashboardLayout activeSection="learning-path">
      <div className="space-y-6">
        <header className="rounded-3xl border border-border/70 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Target className="size-5" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Your roadmap
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                {path?.title || 'Robotics Learner'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {path?.description ||
                  'Build your robotics skills step by step, from core concepts to intelligent projects.'}
              </p>
            </div>
            <div className="w-full rounded-2xl border border-border/70 bg-card/80 p-4 sm:w-56">
              <div className="flex items-end justify-between gap-2">
                <span className="text-sm text-muted-foreground">Path progress</span>
                <span className="text-2xl font-bold">{completionPercent}%</span>
              </div>
              <div
                role="progressbar"
                aria-label="Learning path completion"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completionPercent}
                className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-700 motion-reduce:transition-none"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {completedStepCount} of {stepsWithStatus.length} steps completed
              </p>
            </div>
          </div>
        </header>

        {stepsWithStatus.length ? (
          <section aria-label="Robotics learning roadmap">
            <ol className="pt-2">
              {stepsWithStatus.map((step, index) => (
                <RoadmapStep
                  key={step.id}
                  step={step}
                  status={step.status}
                  isCurrent={step.id === currentStep?.id}
                  isLast={index === stepsWithStatus.length - 1}
                />
              ))}
            </ol>
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Target className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-3 font-semibold">Your roadmap is being prepared</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The Robotics Learner path will appear here when it is ready.
            </p>
          </section>
        )}
      </div>
    </DashboardLayout>
  )
}
