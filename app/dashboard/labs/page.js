import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { LabBookingClient } from '@/components/dashboard/lab-booking-client'
import { bookLab, cancelLabBooking, joinLabBooking, rescheduleLabBooking } from './actions'

export const dynamic = 'force-dynamic'

export default async function LabsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/labs')
  const now = new Date().toISOString()
  const [{ data: booking, error }, { data: stations, error: stationError }, { data: queue }] = await Promise.all([
    supabase.from('lab_bookings').select('id, starts_at, ends_at, status, lab_stations(name)').eq('user_id', user.id).eq('status', 'booked').gte('ends_at', now).order('starts_at').limit(1).maybeSingle(),
    supabase.from('lab_stations').select('id, name, description, status').order('name'),
    supabase.from('lab_queue').select('station_id, requested_at').eq('user_id', user.id).eq('status', 'waiting').order('requested_at'),
  ])
  if (error || stationError) throw new Error(`Unable to load labs: ${error?.message || stationError?.message}`)
  let queuePosition = null
  if (queue?.[0]) {
    const { count } = await supabase.from('lab_queue').select('*', { count: 'exact', head: true }).eq('station_id', queue[0].station_id).eq('status', 'waiting').lte('requested_at', queue[0].requested_at)
    queuePosition = count || 1
  }
  return <DashboardLayout activeSection="remote-labs"><section><div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Remote practice</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Remote labs</h1><p className="mt-2 text-sm text-muted-foreground">Reserve a station; this is a booking system and does not control hardware.</p></div><LabBookingClient booking={booking} stations={stations || []} queuePosition={queuePosition} bookLab={bookLab} cancelLabBooking={cancelLabBooking} joinLabBooking={joinLabBooking} rescheduleLabBooking={rescheduleLabBooking} /></section></DashboardLayout>
}
