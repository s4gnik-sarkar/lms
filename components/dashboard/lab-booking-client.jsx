'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

const localDateTime = (date) => new Date(date).toISOString().slice(0, 16)

export function LabBookingClient({ booking, stations, queuePosition, bookLab, cancelLabBooking, joinLabBooking, rescheduleLabBooking }) {
  const [now, setNow] = useState(0)
  const [showReschedule, setShowReschedule] = useState(false)
  useEffect(() => { const initial = setTimeout(() => setNow(Date.now()), 0); const t = setInterval(() => setNow(Date.now()), 30_000); return () => { clearTimeout(initial); clearInterval(t) } }, [])
  const isActive = booking && now >= new Date(booking.starts_at).getTime() && now <= new Date(booking.ends_at).getTime()
  const canChange = booking && new Date(booking.starts_at).getTime() - now > 60 * 60_000
  return <div className="grid gap-6">
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Your next lab</p>
      {booking ? <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="text-xl font-bold">{booking.lab_stations?.name || 'Lab station'}</h2><p className="mt-1 text-sm text-muted-foreground">{new Date(booking.starts_at).toLocaleString()} – {new Date(booking.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div><div className="flex flex-wrap gap-2">{isActive ? <form action={joinLabBooking.bind(null, booking.id)}><Button>Join lab</Button></form> : <Button disabled>Join lab</Button>}{canChange && <><Button variant="outline" onClick={() => setShowReschedule(!showReschedule)}>Reschedule</Button><form action={cancelLabBooking.bind(null, booking.id)}><Button variant="destructive">Cancel</Button></form></>}</div></div> : <p className="mt-2 text-sm text-muted-foreground">No upcoming lab booking.</p>}
      {booking && !canChange && !isActive && <p className="mt-3 text-xs text-muted-foreground">Changes close one hour before the session.</p>}
      {showReschedule && booking && <form action={rescheduleLabBooking.bind(null, booking.id)} className="mt-5 grid gap-3 rounded-xl bg-muted/60 p-4 sm:grid-cols-2"><label className="text-sm">New start<input required name="starts_at" type="datetime-local" defaultValue={localDateTime(booking.starts_at)} className="mt-1 w-full rounded-md border bg-background p-2" /></label><label className="text-sm">New end<input required name="ends_at" type="datetime-local" defaultValue={localDateTime(booking.ends_at)} className="mt-1 w-full rounded-md border bg-background p-2" /></label><Button className="sm:col-span-2">Confirm reschedule</Button></form>}
    </section>
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="text-xl font-bold">Book a station</h2><p className="mt-1 text-sm text-muted-foreground">Pick an available station and a future slot of up to four hours.</p><form action={bookLab} className="mt-4 grid gap-3 md:grid-cols-3"><label className="text-sm">Station<select name="station_id" required className="mt-1 w-full rounded-md border bg-background p-2">{stations.map((station) => <option key={station.id} value={station.id}>{station.name}{station.status !== 'available' ? ` (${station.status})` : ''}</option>)}</select></label><label className="text-sm">Start<input required name="starts_at" type="datetime-local" className="mt-1 w-full rounded-md border bg-background p-2" /></label><label className="text-sm">End<input required name="ends_at" type="datetime-local" className="mt-1 w-full rounded-md border bg-background p-2" /></label><Button className="md:col-span-3" disabled={!stations.some((station) => station.status === 'available')}>Book slot</Button></form>{queuePosition && <p className="mt-4 rounded-lg bg-primary/10 p-3 text-sm text-primary">All matching capacity was busy when you joined the queue. Your queue position: {queuePosition}.</p>}</section>
  </div>
}
