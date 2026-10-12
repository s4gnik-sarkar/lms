'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function currentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('You must be signed in.')
  return { supabase, user }
}

const id = (value, label) => {
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) throw new Error(`Invalid ${label}.`)
  return value
}

function bookingTimes(formData) {
  const startsAt = new Date(String(formData.get('starts_at') || ''))
  const endsAt = new Date(String(formData.get('ends_at') || ''))
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || startsAt <= new Date() || endsAt <= startsAt) {
    throw new Error('Choose a future slot with an end time after its start.')
  }
  if (endsAt - startsAt > 4 * 60 * 60_000) throw new Error('Lab bookings are limited to four hours.')
  return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() }
}

export async function bookLab(formData) {
  const { supabase, user } = await currentUser()
  const stationId = id(String(formData.get('station_id') || ''), 'station')
  const { startsAt, endsAt } = bookingTimes(formData)
  const { data: station } = await supabase.from('lab_stations').select('id, status').eq('id', stationId).maybeSingle()
  if (!station || station.status !== 'available') throw new Error('That lab station is unavailable.')
  const { error } = await supabase.from('lab_bookings').insert({ user_id: user.id, station_id: stationId, starts_at: startsAt, ends_at: endsAt, status: 'booked' })
  if (error) {
    if (error.code === '23P01') {
      const { error: queueError } = await supabase.from('lab_queue').upsert({ user_id: user.id, station_id: stationId, requested_at: new Date().toISOString(), status: 'waiting' }, { onConflict: 'user_id,station_id' })
      if (queueError) throw new Error(`That slot was taken, and we could not add you to the queue: ${queueError.message}`)
      revalidatePath('/dashboard/labs')
      return
    }
    throw new Error(`Could not book the station: ${error.message}`)
  }
  revalidatePath('/dashboard/labs')
}

export async function cancelLabBooking(bookingId) {
  const { supabase, user } = await currentUser()
  const { data: booking, error } = await supabase.from('lab_bookings').select('id, starts_at, status').eq('id', id(bookingId, 'booking')).eq('user_id', user.id).maybeSingle()
  if (error || !booking) throw new Error('Booking not found.')
  if (booking.status !== 'booked' || new Date(booking.starts_at).getTime() - Date.now() <= 60 * 60_000) throw new Error('Bookings can only be cancelled more than one hour before they begin.')
  const { error: updateError } = await supabase.from('lab_bookings').update({ status: 'cancelled' }).eq('id', booking.id).eq('user_id', user.id)
  if (updateError) throw new Error(`Could not cancel booking: ${updateError.message}`)
  revalidatePath('/dashboard/labs')
}

export async function rescheduleLabBooking(bookingId, formData) {
  const { supabase, user } = await currentUser()
  const booking = await supabase.from('lab_bookings').select('id, starts_at, status').eq('id', id(bookingId, 'booking')).eq('user_id', user.id).maybeSingle()
  if (booking.error || !booking.data) throw new Error('Booking not found.')
  if (booking.data.status !== 'booked' || new Date(booking.data.starts_at).getTime() - Date.now() <= 60 * 60_000) throw new Error('Bookings can only be rescheduled more than one hour before they begin.')
  const { startsAt, endsAt } = bookingTimes(formData)
  const { error } = await supabase.from('lab_bookings').update({ starts_at: startsAt, ends_at: endsAt }).eq('id', booking.data.id).eq('user_id', user.id).eq('status', 'booked')
  if (error) throw new Error(error.code === '23P01' ? 'That time slot has just been booked.' : `Could not reschedule: ${error.message}`)
  revalidatePath('/dashboard/labs')
}

export async function joinLabBooking(bookingId) {
  const { supabase, user } = await currentUser()
  const safeBookingId = id(bookingId, 'booking')
  const { data: booking, error } = await supabase
    .from('lab_bookings')
    .select('starts_at, ends_at, status')
    .eq('id', safeBookingId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (error || !booking) throw new Error('Booking not found.')
  const now = Date.now()
  if (booking.status !== 'booked' || now < new Date(booking.starts_at).getTime() || now > new Date(booking.ends_at).getTime()) {
    throw new Error('The lab room is only available during your active booking.')
  }
  redirect(`/labs/room/${safeBookingId}`)
}
