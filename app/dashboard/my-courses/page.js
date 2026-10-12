import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentDashboardData } from '@/lib/dashboard-data'
import { StudentDashboard } from '@/components/dashboard/student-dashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardCoursesPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login?next=/dashboard/my-courses')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    throw new Error(`Unable to load your profile: ${profileError.message}`)
  }
  if (profile?.role === 'instructor') {
    redirect('/dashboard')
  }

  const data = await getStudentDashboardData(supabase, user.id)

  return (
    <StudentDashboard
      activeSection="my-courses"
      displayName={data.profile?.full_name || user.email?.split('@')[0] || 'Learner'}
      subscription={data.subscription}
      courses={data.courses}
      continueCourse={data.continueCourse}
      recommendations={data.recommendations}
      savedCourses={data.savedCourses}
      savedCourseIds={data.savedCourseIds}
    />
  )
}
