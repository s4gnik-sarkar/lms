import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayout, dashboardSections } from '@/components/dashboard/dashboard-layout'

export const dynamic = 'force-dynamic'

export default async function DashboardComingSoonPage({ params }) {
  const { section } = await params
  const sectionInfo = dashboardSections.find((item) => item.key === section)

  if (!sectionInfo || ['overview', 'my-courses'].includes(section)) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect(`/login?next=/dashboard/${section}`)
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

  const Icon = sectionInfo.icon

  return (
    <DashboardLayout activeSection={section}>
      <section className="flex min-h-[60vh] flex-col items-center justify-center rounded-3xl border border-border/70 bg-card px-6 py-16 text-center shadow-sm">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-8" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {sectionInfo.label}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{sectionInfo.label} is coming soon</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          We are getting this part of your learning space ready. In the meantime, you can keep
          exploring your courses and progress from the dashboard.
        </p>
      </section>
    </DashboardLayout>
  )
}
