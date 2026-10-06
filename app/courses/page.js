import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, User, ArrowRight, Search, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

/**
 * Public Courses Catalog Page
 *
 * Requirements:
 * - Publicly viewable without logging in.
 * - Supports search query via URL param ?q=<text>.
 * - Awaits searchParams as required in Next.js 15+.
 * - Filters by title and description using case-insensitive Supabase ilike.
 * - Shows results count, "Clear search" link, and friendly empty states.
 * - Exposes instructor display name (full_name) safely without exposing private emails.
 */
export default async function CoursesPage({ searchParams }) {
  // In Next.js 15+, searchParams is a Promise and must be awaited
  const resolvedParams = await searchParams
  const rawQuery = resolvedParams?.q ? String(resolvedParams.q).trim() : ''

  const supabase = await createClient()

  // 1. Check if visitor is logged in (optional, for displaying enrollment status badges)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 2. Build the courses database query
  let query = supabase
    .from('courses')
    .select(`
      id,
      title,
      description,
      created_at,
      profiles:instructor_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })

  // 3. Apply search filter if query text is present
  if (rawQuery) {
    // Sanitize special characters (% and _ are wildcards in SQL LIKE/ILIKE)
    const sanitized = rawQuery.replace(/[%_'"\\]/g, '')
    if (sanitized) {
      query = query.or(
        `title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`
      )
    }
  }

  const { data: coursesData, error: coursesError } = await query
  const courses = coursesData || []

  // 4. Query student enrollments if logged in
  let userEnrollments = new Set()
  if (user) {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', user.id)

    if (enrollments) {
      userEnrollments = new Set(enrollments.map((e) => e.course_id))
    }
  }

  // 5. Query lesson counts per course
  const { data: lessonsData } = await supabase
    .from('lessons')
    .select('course_id')

  const lessonCountMap = new Map()
  if (lessonsData) {
    for (const l of lessonsData) {
      lessonCountMap.set(l.course_id, (lessonCountMap.get(l.course_id) || 0) + 1)
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-8 sm:mb-12 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-3">
          <Sparkles className="size-3.5" />
          <span>Explore All Learning Paths</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          Browse Courses
        </h1>
        <p className="mt-3 text-base sm:text-lg text-muted-foreground">
          Discover hands-on courses taught by experienced developers. From web fundamentals to full-stack cloud and IoT.
        </p>

        {/* Dedicated Search Input on the page */}
        <form
          action="/courses"
          method="GET"
          className="relative mt-6 max-w-md mx-auto"
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery}
            placeholder="Search by course title or topic..."
            className="h-11 w-full rounded-full border border-input/60 bg-muted/40 pl-10 pr-20 text-sm outline-none transition focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/20"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full h-8 px-3.5 text-xs font-semibold"
          >
            Search
          </Button>
        </form>
      </div>

      {/* Active Search Results Banner */}
      {rawQuery && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/30 px-5 py-3.5">
          <div className="text-sm">
            <span className="text-muted-foreground">Results for: </span>
            <strong className="text-foreground">&ldquo;{rawQuery}&rdquo;</strong>
            <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {courses.length} {courses.length === 1 ? 'course' : 'courses'} found
            </span>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-4"
          >
            <X className="size-3.5" />
            Clear search
          </Link>
        </div>
      )}

      {/* Error State */}
      {coursesError && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
          Failed to load courses: {coursesError.message}
        </div>
      )}

      {/* Empty States */}
      {!coursesError && courses.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center max-w-lg mx-auto">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            <BookOpen className="size-6" />
          </div>
          <h2 className="text-xl font-bold">
            {rawQuery ? 'No courses found' : 'No courses available yet'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {rawQuery
              ? `We couldn't find any courses matching "${rawQuery}". Try searching for something else or clear the filter.`
              : 'Our instructors are currently crafting new courses. Please check back soon!'}
          </p>
          {rawQuery && (
            <div className="mt-6">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/courses">View all courses</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Courses Cards Grid */}
      {!coursesError && courses.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const isEnrolled = userEnrollments.has(course.id)
            const lessonCount = lessonCountMap.get(course.id) || 0
            const instructorName =
              course.profiles?.full_name || 'Verified Instructor'

            return (
              <div
                key={course.id}
                className="group flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
              >
                <div>
                  {/* Top meta tags */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                      <BookOpen className="size-3.5" />
                      {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
                    </span>
                    {isEnrolled && (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        ✓ Enrolled
                      </span>
                    )}
                  </div>

                  {/* Course Title */}
                  <h2 className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                    <Link href={`/courses/${course.id}`}>{course.title}</Link>
                  </h2>

                  {/* Course Description */}
                  <p className="mt-2.5 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {course.description || 'No description provided for this course yet.'}
                  </p>
                </div>

                {/* Card Footer: Instructor info & CTA button */}
                <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                      {instructorName[0]?.toUpperCase() || <User className="size-3" />}
                    </div>
                    <span className="truncate max-w-[130px] font-medium text-foreground">
                      {instructorName}
                    </span>
                  </div>

                  <Button
                    asChild
                    size="sm"
                    variant={isEnrolled ? 'outline' : 'default'}
                    className="rounded-full gap-1.5 text-xs font-semibold shrink-0"
                  >
                    <Link href={`/courses/${course.id}`}>
                      {isEnrolled ? 'Continue' : 'View Course'}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

