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

function requireId(value, label) {
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) {
    throw new Error(`Invalid ${label}.`)
  }
  return value
}

export async function registerForSession(sessionId) {
  const { supabase, user } = await currentUser()
  const id = requireId(sessionId, 'session')
  const { data: session, error } = await supabase
    .from('live_sessions')
    .select('id, starts_at')
    .eq('id', id)
    .maybeSingle()
  if (error || !session || new Date(session.starts_at) <= new Date()) {
    throw new Error('This session is no longer available for registration.')
  }
  const { error: registrationError } = await supabase
    .from('session_registrations')
    .upsert({ session_id: id, user_id: user.id }, { onConflict: 'session_id,user_id' })
  if (registrationError) throw new Error(`Could not register: ${registrationError.message}`)
  revalidatePath('/dashboard/live')
}

export async function unregisterFromSession(sessionId) {
  const { supabase, user } = await currentUser()
  const id = requireId(sessionId, 'session')
  const { data: session } = await supabase
    .from('live_sessions')
    .select('starts_at')
    .eq('id', id)
    .maybeSingle()
  if (!session || new Date(session.starts_at) <= new Date()) {
    throw new Error('This session has already started and cannot be unregistered.')
  }
  const { error } = await supabase
    .from('session_registrations')
    .delete()
    .eq('session_id', id)
    .eq('user_id', user.id)
  if (error) throw new Error(`Could not unregister: ${error.message}`)
  revalidatePath('/dashboard/live')
}

export async function createLiveSession(formData) {
  const { supabase, user } = await currentUser()
  const title = String(formData.get('title') || '').trim()
  const type = String(formData.get('type') || '')
  const startsAt = new Date(String(formData.get('starts_at') || ''))
  const duration = Number(formData.get('duration_min'))
  const meetingUrl = String(formData.get('meeting_url') || '').trim()
  const courseId = String(formData.get('course_id') || '').trim() || null
  if (!title || !['class', 'webinar', 'instructor_session'].includes(type) || !Number.isInteger(duration) || duration < 5 || duration > 480 || Number.isNaN(startsAt.getTime()) || startsAt <= new Date()) {
    throw new Error('Enter a future start time, valid title, type, and duration.')
  }
  try { new URL(meetingUrl) } catch { throw new Error('Enter a valid meeting URL.') }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'instructor') throw new Error('Only instructors can create live sessions.')
  if (courseId) {
    const { data: course } = await supabase.from('courses').select('id').eq('id', requireId(courseId, 'course')).eq('instructor_id', user.id).maybeSingle()
    if (!course) throw new Error('You can only attach one of your own courses.')
  }
  const { error } = await supabase.from('live_sessions').insert({ title, type, starts_at: startsAt.toISOString(), duration_min: duration, meeting_url: meetingUrl, instructor_id: user.id, course_id: courseId })
  if (error) throw new Error(`Could not create session: ${error.message}`)
  revalidatePath('/dashboard/live')
}

export async function joinLiveSession(sessionId) {
  const { supabase, user } = await currentUser()
  const id = requireId(sessionId, 'session')
  const { data: session, error } = await supabase.from('live_sessions').select('starts_at, duration_min, meeting_url, instructor_id').eq('id', id).maybeSingle()
  if (error || !session) throw new Error('Session not found.')
  const now = Date.now()
  const start = new Date(session.starts_at).getTime()
  const end = start + session.duration_min * 60_000
  if (now < start - 10 * 60_000 || now > end) throw new Error('The meeting can only be joined from 10 minutes before it starts until it ends.')
  if (session.instructor_id !== user.id) {
    const { data: registration } = await supabase.from('session_registrations').select('id').eq('session_id', id).eq('user_id', user.id).maybeSingle()
    if (!registration) throw new Error('Register for this session before joining.')
  }
  redirect(session.meeting_url)
}
