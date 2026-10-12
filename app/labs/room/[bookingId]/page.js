import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function LabRoomPage({ params }) {
  const { bookingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/labs/room/${bookingId}`)
  const { data: booking } = await supabase.from('lab_bookings').select('id, starts_at, ends_at, status, lab_stations(name, description)').eq('id', bookingId).eq('user_id', user.id).maybeSingle()
  if (!booking) notFound()
  const now = new Date().getTime()
  if (booking.status !== 'booked' || now < new Date(booking.starts_at).getTime() || now > new Date(booking.ends_at).getTime()) {
    return <main className="mx-auto max-w-xl p-8"><h1 className="text-2xl font-bold">Lab room unavailable</h1><p className="mt-2 text-muted-foreground">This room is available only during your active booking.</p></main>
  }
  return <main className="mx-auto max-w-2xl p-8"><p className="text-sm font-semibold uppercase tracking-wider text-primary">Placeholder room</p><h1 className="mt-2 text-3xl font-bold">{booking.lab_stations?.name || 'Remote lab'}</h1><p className="mt-3 text-muted-foreground">Your booked lab session is active. Hardware controls will be integrated here in a future release.</p></main>
}
