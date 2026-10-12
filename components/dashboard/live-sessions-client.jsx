'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

function formatCountdown(startsAt, now) {
  const delta = new Date(startsAt).getTime() - now
  if (delta <= 0) return 'In progress'
  const minutes = Math.floor(delta / 60_000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  return days ? `${days}d ${hours}h` : `${hours}h ${minutes % 60}m`
}

export function LiveSessionsClient({ sessions, registerForSession, unregisterFromSession, joinLiveSession }) {
  const [now, setNow] = useState(0)
  useEffect(() => {
    const initialTimer = window.setTimeout(() => setNow(Date.now()), 0)
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(timer)
    }
  }, [])
  return <div className="grid gap-4">
    {sessions.map((session) => {
      const start = new Date(session.starts_at).getTime()
      const joinOpen = now >= start - 10 * 60_000 && now <= start + session.duration_min * 60_000
      return <article key={session.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{session.type.replace('_', ' ')}</p>
            <h2 className="mt-1 text-lg font-bold">{session.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{new Date(session.starts_at).toLocaleString()} · {session.duration_min} minutes</p>
            <p className="mt-2 text-sm font-medium">{formatCountdown(session.starts_at, now)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {session.isRegistered ? <form action={unregisterFromSession.bind(null, session.id)}><Button variant="outline" size="sm">Unregister</Button></form> : <form action={registerForSession.bind(null, session.id)}><Button size="sm">Register</Button></form>}
            <form action={joinLiveSession.bind(null, session.id)}><Button size="sm" disabled={!joinOpen || (!session.isRegistered && !session.isInstructor)}>{joinOpen ? 'Join' : 'Join opens 10 min before'}</Button></form>
          </div>
        </div>
      </article>
    })}
  </div>
}
