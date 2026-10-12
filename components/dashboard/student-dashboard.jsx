'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  Clock3,
  Play,
  Sparkles,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { resumeLesson, setSavedCourse } from '@/app/dashboard/actions'

const libraryTabs = ['Enrolled', 'Completed', 'Saved', 'Recommended']

function SaveButton({ courseId, isSaved }) {
  return (
    <form action={setSavedCourse.bind(null, courseId, !isSaved)}>
      <button
        type="submit"
        aria-label={isSaved ? 'Remove from saved courses' : 'Save course'}
        title={isSaved ? 'Remove from saved courses' : 'Save course'}
        className={`flex size-9 items-center justify-center rounded-full border transition ${
          isSaved
            ? 'border-primary/30 bg-primary/10 text-primary'
            : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary'
        }`}
      >
        <Bookmark className={`size-4 ${isSaved ? 'fill-current' : ''}`} />
      </button>
    </form>
  )
}

function CourseCard({ course, savedIds, enrolled = false }) {
  const isSaved = savedIds.includes(course.id)
  const instructor = course.profiles?.full_name || 'Robotics instructor'

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {course.category || 'Robotics'}
        </span>
        <SaveButton courseId={course.id} isSaved={isSaved} />
      </div>
      <h3 className="mt-4 text-lg font-bold leading-snug">
        <Link href={`/courses/${course.id}`} className="hover:text-primary">
          {course.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
        {course.description || 'Explore the concepts and build your practical robotics skills.'}
      </p>
      {enrolled && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {course.completedLessons} of {course.totalLessons} lessons
            </span>
            <span className="font-semibold">{course.progressPercent}%</span>
          </div>
          <div
            role="progressbar"
            aria-label={`${course.title} completion`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={course.progressPercent}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${course.progressPercent}%` }}
            />
          </div>
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        <span className="truncate text-xs text-muted-foreground">{instructor}</span>
        <Link
          href={`/courses/${course.id}`}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          {enrolled ? 'Open course' : 'Explore'}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </article>
  )
}

function EmptyLibrary({ tab }) {
  const descriptions = {
    Enrolled: 'Browse the catalog and enroll in a course to see your learning progress here.',
    Completed: 'Courses will appear here when you finish all of their lessons.',
    Saved: 'Bookmark courses you want to come back to and they will be collected here.',
    Recommended: 'There are no new courses to recommend right now. Check back soon.',
  }

  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <BookOpen className="mx-auto size-8 text-muted-foreground" />
      <h3 className="mt-3 font-semibold">Nothing in {tab.toLowerCase()} yet</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{descriptions[tab]}</p>
      <Link
        href="/courses"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Browse courses <ArrowRight className="size-4" />
      </Link>
    </div>
  )
}

function CourseLibrary({ courses, savedCourses, recommendations, savedCourseIds }) {
  const [activeTab, setActiveTab] = useState('Enrolled')
  const completedCourses = courses.filter(
    (course) => course.totalLessons > 0 && course.progressPercent === 100
  )
  const tabCourses = {
    Enrolled: courses,
    Completed: completedCourses,
    Saved: savedCourses,
    Recommended: recommendations,
  }
  const selectedCourses = tabCourses[activeTab]

  return (
    <section id="course-library" className="mt-8 scroll-mt-24">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your library</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">My Courses</h2>
        </div>
        <Link href="/courses" className="text-sm font-semibold text-primary hover:underline">
          Browse all courses <ArrowRight className="ml-1 inline size-4" />
        </Link>
      </div>

      <div role="tablist" aria-label="Course library" className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {libraryTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Recommended' && (
        <p className="mb-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          Recommendations rank courses in categories you are already enrolled in first; ties are
          ordered by newest course. Robotics catalog courses are shown when there is no category
          match.
        </p>
      )}

      {selectedCourses.length === 0 ? (
        <EmptyLibrary tab={activeTab} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {selectedCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              savedIds={savedCourseIds}
              enrolled={activeTab === 'Enrolled' || activeTab === 'Completed'}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function SubscriptionBadge({ subscription }) {
  const rawStatus = subscription?.status || 'none'
  const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1)
  const styles = {
    active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    trial: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    expired: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    none: 'bg-muted text-muted-foreground',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status.toLowerCase()] || styles.none
      }`}
    >
      {status}
    </span>
  )
}

export function StudentDashboard({
  activeSection = 'overview',
  displayName,
  subscription,
  courses,
  continueCourse,
  recommendations,
  savedCourses,
  savedCourseIds,
}) {
  const renewDate = subscription?.renewal_date
    ? new Date(`${subscription.renewal_date}T00:00:00`).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <DashboardLayout activeSection={activeSection}>
      {activeSection === 'my-courses' ? (
        <div>
          <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your learning</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">My Courses</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Pick up where you left off, revisit completed courses, or save something for later.
            </p>
          </div>
          <CourseLibrary
            courses={courses}
            savedCourses={savedCourses}
            recommendations={recommendations}
            savedCourseIds={savedCourseIds}
          />
        </div>
      ) : (
        <>
          <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-9">
            <div className="absolute -right-12 -top-16 size-56 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Student dashboard</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome back, {displayName}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Every great build starts with one more thing learned.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <SubscriptionBadge subscription={subscription} />
                {subscription?.plan && (
                  <span className="text-sm font-medium">{subscription.plan} plan</span>
                )}
                {renewDate && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock3 className="size-4" />
                    Renews {renewDate}
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <p className="text-sm text-muted-foreground">Courses in progress</p>
              <p className="mt-2 text-3xl font-bold">
                {courses.filter((course) => course.progressPercent < 100).length}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <p className="text-sm text-muted-foreground">Lessons completed</p>
              <p className="mt-2 text-3xl font-bold">
                {courses.reduce((total, course) => total + course.completedLessons, 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <p className="text-sm text-muted-foreground">Courses completed</p>
              <p className="mt-2 text-3xl font-bold">
                {courses.filter((course) => course.totalLessons > 0 && course.progressPercent === 100).length}
              </p>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your next step</p>
                <h2 className="mt-1 text-xl font-bold">Continue learning</h2>
              </div>
              <span className="hidden rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
                Most recently touched
              </span>
            </div>
            {continueCourse ? (
              <div className="flex flex-col gap-5 rounded-2xl bg-muted/50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-primary">
                    {continueCourse.category || 'Robotics'}
                  </span>
                  <h3 className="mt-1 truncate text-xl font-bold">{continueCourse.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {continueCourse.nextLesson
                      ? `Next lesson: ${continueCourse.nextLesson.title}`
                      : continueCourse.totalLessons > 0
                        ? 'You have completed every lesson. Revisit the course any time.'
                        : 'Lessons are being prepared for this course.'}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 w-40 overflow-hidden rounded-full bg-background">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${continueCourse.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold">{continueCourse.progressPercent}% complete</span>
                  </div>
                </div>
                {continueCourse.nextLesson ? (
                  <form action={resumeLesson.bind(null, continueCourse.id, continueCourse.nextLesson.id)}>
                    <button
                      type="submit"
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                    >
                      <Play className="size-4 fill-current" />
                      Resume
                    </button>
                  </form>
                ) : (
                  <Link
                    href={`/courses/${continueCourse.id}`}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                  >
                    {continueCourse.totalLessons > 0 ? <Check className="size-4" /> : <BookOpen className="size-4" />}
                    {continueCourse.totalLessons > 0 ? 'Review course' : 'Open course'}
                  </Link>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <BookOpen className="mx-auto size-8 text-muted-foreground" />
                <h3 className="mt-3 font-semibold">Your learning starts here</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  You are not enrolled in any courses yet. Find a course that sparks your curiosity.
                </p>
                <Link
                  href="/courses"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Explore courses <ArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </section>

        </>
      )}
    </DashboardLayout>
  )
}
