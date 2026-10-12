export async function getStudentDashboardData(supabase, userId) {
  const [
    { data: profile, error: profileError },
    { data: subscription, error: subscriptionError },
    { data: enrollmentRows, error: enrollmentError },
    { data: savedRows, error: savedError },
    { data: availableRows, error: availableError },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
    supabase
      .from('subscriptions')
      .select('plan, status, renewal_date')
      .eq('user_id', userId)
      .order('renewal_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('enrollments')
      .select(`
        enrolled_at,
        courses (
          id,
          title,
          description,
          category,
          created_at,
          profiles:instructor_id (full_name)
        )
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false }),
    supabase
      .from('saved_courses')
      .select('course_id, courses (id, title, description, category, created_at, profiles:instructor_id (full_name))')
      .eq('user_id', userId),
    supabase
      .from('courses')
      .select('id, title, description, category, created_at, profiles:instructor_id (full_name)')
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
  ])

  for (const error of [profileError, subscriptionError, enrollmentError, savedError, availableError]) {
    if (error) {
      throw new Error(`Unable to load student dashboard: ${error.message}`)
    }
  }

  const enrollments = (enrollmentRows || [])
    .filter((row) => row.courses)
    .map((row) => ({ ...row.courses, enrolledAt: row.enrolled_at }))
  const enrolledIds = new Set(enrollments.map((course) => course.id))
  const courseIds = enrollments.map((course) => course.id)
  let lessons = []
  let progressRows = []

  if (courseIds.length > 0) {
    const { data, error } = await supabase
      .from('lessons')
      .select('id, course_id, title, position')
      .in('course_id', courseIds)
      .order('position', { ascending: true })

    if (error) {
      throw new Error(`Unable to load course lessons: ${error.message}`)
    }

    lessons = data || []
    const lessonIds = lessons.map((lesson) => lesson.id)

    if (lessonIds.length > 0) {
      const { data: progress, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id, is_completed, completed_at, updated_at')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)

      if (progressError) {
        throw new Error(`Unable to load lesson progress: ${progressError.message}`)
      }

      progressRows = progress || []
    }
  }

  const lessonsByCourse = new Map()
  for (const lesson of lessons) {
    const courseLessons = lessonsByCourse.get(lesson.course_id) || []
    courseLessons.push(lesson)
    lessonsByCourse.set(lesson.course_id, courseLessons)
  }

  const progressByLesson = new Map(progressRows.map((row) => [row.lesson_id, row]))
  const courses = enrollments.map((course) => {
    const courseLessons = lessonsByCourse.get(course.id) || []
    const completedLessons = courseLessons.filter(
      (lesson) => progressByLesson.get(lesson.id)?.is_completed
    ).length
    const courseProgress = courseLessons
      .map((lesson) => progressByLesson.get(lesson.id))
      .filter(Boolean)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))

    return {
      ...course,
      lessons: courseLessons,
      completedLessons,
      totalLessons: courseLessons.length,
      progressPercent: courseLessons.length
        ? Math.round((completedLessons / courseLessons.length) * 100)
        : 0,
      lastTouchedAt: courseProgress[0]?.updated_at || null,
      nextLesson:
        courseLessons.find((lesson) => !progressByLesson.get(lesson.id)?.is_completed) || null,
    }
  })

  const touchedCourses = courses.filter((course) => course.lastTouchedAt)
  const continueCourse = touchedCourses.length
    ? touchedCourses.sort(
        (a, b) => new Date(b.lastTouchedAt) - new Date(a.lastTouchedAt)
      )[0]
    : courses[0] || null

  const enrolledCategories = new Set(
    courses
      .map((course) => course.category?.trim().toLocaleLowerCase())
      .filter(Boolean)
  )
  const recommendations = (availableRows || [])
    .filter((course) => !enrolledIds.has(course.id))
    .map((course) => ({
      ...course,
      categoryMatch: enrolledCategories.has(course.category?.trim().toLocaleLowerCase()),
    }))
    .sort(
      (a, b) =>
        Number(b.categoryMatch) - Number(a.categoryMatch) ||
        new Date(b.created_at) - new Date(a.created_at)
    )

  return {
    profile,
    subscription,
    courses,
    continueCourse,
    recommendations,
    savedCourses: (savedRows || []).map((row) => row.courses).filter(Boolean),
    savedCourseIds: (savedRows || []).map((row) => row.course_id),
  }
}
