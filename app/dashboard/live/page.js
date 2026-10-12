import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { LiveSessionsClient } from '@/components/dashboard/live-sessions-client'
import { createLiveSession, joinLiveSession, registerForSession, unregisterFromSession } from './actions'

export const dynamic = 'force-dynamic'

export default async function LiveSessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/live')
  const [{ data: profile }, { data: rows, error }, { data: courses }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    supabase.from('live_sessions').select('id, title, type, starts_at, duration_min, instructor_id').order('starts_at'),
    supabase.from('courses').select('id, title').eq('instructor_id', user.id).order('title'),
  ])
  if (error) throw new Error(`Unable to load live sessions: ${error.message}`)
  const sessions = await Promise.all((rows || []).map(async (session) => {
    const { data: registration } = await supabase.from('session_registrations').select('id').eq('session_id', session.id).eq('user_id', user.id).maybeSingle()
    return { ...session, isRegistered: Boolean(registration), isInstructor: session.instructor_id === user.id }
  }))
  return <DashboardLayout activeSection="live-classes"><section className="space-y-6"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Live learning</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Live classes</h1><p className="mt-2 text-sm text-muted-foreground">Register now. Meeting access opens 10 minutes before each session.</p></div>{profile?.role === 'instructor' && <details className="rounded-2xl border border-border bg-card p-5 shadow-sm"><summary className="cursor-pointer font-semibold">Create a live session</summary><form action={createLiveSession} className="mt-4 grid gap-3 md:grid-cols-2"><input name="title" required placeholder="Session title" className="rounded-md border bg-background p-2" /><select name="type" defaultValue="class" className="rounded-md border bg-background p-2"><option value="class">Class</option><option value="webinar">Webinar</option><option value="instructor_session">Instructor session</option></select><label className="text-sm">Starts at<input name="starts_at" required type="datetime-local" className="mt-1 w-full rounded-md border bg-background p-2" /></label><label className="text-sm">Duration (minutes)<input name="duration_min" required type="number" min="5" max="480" defaultValue="60" className="mt-1 w-full rounded-md border bg-background p-2" /></label><input name="meeting_url" required type="url" placeholder="https://meeting.example" className="rounded-md border bg-background p-2" /><select name="course_id" className="rounded-md border bg-background p-2"><option value="">No course attached</option>{(courses || []).map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select><button className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground md:col-span-2">Create session</button></form></details>}<LiveSessionsClient sessions={sessions} registerForSession={registerForSession} unregisterFromSession={unregisterFromSession} joinLiveSession={joinLiveSession} /></section></DashboardLayout>
}
