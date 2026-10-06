import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Plus, ArrowRight, User, CheckCircle2, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export const dynamic = 'force-dynamic'

/**
 * My Courses Page (Protected for logged-in users)
 *
 * Requirements:
 * - Student: displays the courses they are enrolled in, rendered as course cards
 *   with progress bars (completed vs total lessons).
 * - Instructor: displays the courses they created, with a quick link to create new courses.
 * - Both: Includes a friendly empty state and a "Browse all courses" button linking to /courses.
 */
export default async function MyCoursesPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user || userError) {
    redirect('/login?next=/my-courses')
  }

  // 2. Fetch user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role || 'student'
  const isInstructor = userRole === 'instructor'

  // ---------------------------------------------------------------------------
  // INSTRUCTOR DATA FETCHING
  // ---------------------------------------------------------------------------
  let instructorCourses = []
  if (isInstructor) {
    const { data } = await supabase
      .from('courses')
      .select('id, title, description, created_at')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false })
    instructorCourses = data || []
  }

  // ---------------------------------------------------------------------------
  // STUDENT DATA FETCHING (Enrolled courses + Progress tracking)
  // ---------------------------------------------------------------------------
  let enrolledCoursesWithProgress = []
  if (!isInstructor) {
    // A. Query enrolled courses with joined instructor profile
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        enrolled_at,
        courses (
          id,
          title,
          description,
          created_at,
          profiles:instructor_id (
            full_name
          )
        )
      `)
      .eq('user_id', user.id)
      .order('enrolled_at', { ascending: false })

    const enrolledList = (enrollments || [])
      .map((e) => e.courses)
      .filter(Boolean)

    if (enrolledList.length > 0) {
      const courseIds = enrolledList.map((c) => c.id)

      // B. Query all lessons for these enrolled courses
      const { data: allLessons } = await supabase
        .from('lessons')
        .select('id, course_id')
        .in('course_id', courseIds)

      const lessonsList = allLessons || []

      // C. Query completed lesson progress records for this student
      const lessonIds = lessonsList.map((l) => l.id)
      let completedLessonIds = new Set()

      if (lessonIds.length > 0) {
        const { data: progressRows } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('is_completed', true)
          .in('lesson_id', lessonIds)

        if (progressRows) {
          completedLessonIds = new Set(progressRows.map((p) => p.lesson_id))
        }
      }

      // D. Calculate progress percentage per course
      enrolledCoursesWithProgress = enrolledList.map((course) => {
        const courseLessons = lessonsList.filter((l) => l.course_id === course.id)
        const totalLessons = courseLessons.length
        const completedLessons = courseLessons.filter((l) =>
          completedLessonIds.has(l.id)
        ).length

        const progressPercent =
          totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

        return {
          ...course,
          totalLessons,
          completedLessons,
          progressPercent,
        }
      })
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            My Courses
          </h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            {isInstructor
              ? 'Manage and monitor all the courses you have authored.'
              : 'Keep track of your ongoing courses and learning progress.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="rounded-full gap-2 text-xs font-semibold">
            <Link href="/courses">
              <Compass className="size-4" />
              Browse All Courses
            </Link>
          </Button>

          {isInstructor && (
            <Button asChild className="rounded-full gap-2 text-xs font-semibold">
              <Link href="/courses/new">
                <Plus className="size-4" />
                Create Course
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* INSTRUCTOR VIEW                                                      */}
      {/* -------------------------------------------------------------------- */}
      {isInstructor && (
        <div>
          {instructorCourses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center max-w-lg mx-auto">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <BookOpen className="size-6" />
              </div>
              <h2 className="text-xl font-bold">You haven&apos;t created any courses yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Start sharing your knowledge with students worldwide by publishing your first course.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild className="rounded-full gap-2">
                  <Link href="/courses/new">
                    <Plus className="size-4" />
                    Create Your First Course
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/courses">Browse courses</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {instructorCourses.map((course) => (
                <div
                  key={course.id}
                  className="group flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        Instructor
                      </span>
                    </div>

                    <h2 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                      <Link href={`/courses/${course.id}`}>{course.title}</Link>
                    </h2>
                    <p className="mt-2.5 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {course.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground font-medium">
                      Created {new Date(course.created_at).toLocaleDateString()}
                    </span>
                    <Button asChild size="sm" className="rounded-full gap-1.5 text-xs font-semibold">
                      <Link href={`/courses/${course.id}`}>
                        Manage Course <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* STUDENT VIEW (Enrolled Courses with Progress Bar)                    */}
      {/* -------------------------------------------------------------------- */}
      {!isInstructor && (
        <div>
          {enrolledCoursesWithProgress.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center max-w-lg mx-auto">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Compass className="size-6" />
              </div>
              <h2 className="text-xl font-bold">You are not enrolled in any courses yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Explore our catalog to find exciting topics, master new tech skills, and track your progress here.
              </p>
              <div className="mt-6">
                <Button asChild className="rounded-full gap-2 font-semibold">
                  <Link href="/courses">
                    <Compass className="size-4" />
                    Browse All Courses
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {enrolledCoursesWithProgress.map((course) => (
                <div
                  key={course.id}
                  className="group flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                >
                  <div>
                    {/* Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        ✓ Enrolled
                      </span>
                      {course.progressPercent === 100 && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500">
                          <CheckCircle2 className="size-3.5" />
                          Completed
                        </span>
                      )}
                    </div>

                    {/* Course Title */}
                    <h2 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                      <Link href={`/courses/${course.id}`}>{course.title}</Link>
                    </h2>
                    <p className="mt-2.5 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {course.description || 'No description provided.'}
                    </p>

                    {/* Progress Bar Section */}
                    <div className="mt-5 space-y-2 rounded-xl bg-muted/40 p-3">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-bold text-foreground">
                          {course.progressPercent}%
                        </span>
                      </div>
                      <Progress value={course.progressPercent} className="h-2" />
                      <div className="text-[11px] text-muted-foreground flex justify-between">
                        <span>
                          {course.completedLessons} of {course.totalLessons} lessons completed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Instructor info & CTA */}
                  <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                        {course.profiles?.full_name?.[0]?.toUpperCase() || <User className="size-3" />}
                      </div>
                      <span className="truncate max-w-[120px] font-medium text-foreground">
                        {course.profiles?.full_name || 'Instructor'}
                      </span>
                    </div>

                    <Button asChild size="sm" className="rounded-full gap-1.5 text-xs font-semibold shrink-0">
                      <Link href={`/courses/${course.id}`}>
                        {course.progressPercent > 0 ? 'Continue' : 'Start'}
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

