'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/** Animated glass surface shared by the authentication forms. */
export default function AuthCardShell({ children, className }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    setTilt({
      x: ((event.clientX - rect.left - rect.width / 2) / rect.width) * 14,
      y: ((event.clientY - rect.top - rect.height / 2) / rect.height) * -14,
    })
  }

  return (
    <div className="auth-card-enter w-full max-w-md [perspective:1400px]">
      <div style={{ transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` }} onMouseMove={handleMouseMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })} className="relative transition-transform duration-200 ease-out">
        <div className="group relative rounded-2xl p-px">
          <div aria-hidden="true" className="auth-card-pulse pointer-events-none absolute -inset-px rounded-2xl opacity-60 blur-sm" style={{ boxShadow: '0 0 22px 3px rgba(147, 197, 253, 0.20)' }} />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="auth-beam auth-beam-top absolute top-0 h-px w-1/2 bg-gradient-to-r from-transparent via-white to-transparent" />
            <div className="auth-beam auth-beam-right absolute right-0 h-1/2 w-px bg-gradient-to-b from-transparent via-white to-transparent" />
            <div className="auth-beam auth-beam-bottom absolute bottom-0 h-px w-1/2 bg-gradient-to-r from-transparent via-white to-transparent" />
            <div className="auth-beam auth-beam-left absolute bottom-0 h-1/2 w-px bg-gradient-to-b from-transparent via-white to-transparent" />
          </div>
          <div className={cn('relative overflow-hidden rounded-2xl border border-white/10 bg-black p-6 text-white shadow-2xl backdrop-blur-xl sm:p-8', className)}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(135deg,white_0.5px,transparent_0.5px),linear-gradient(45deg,white_0.5px,transparent_0.5px)] [background-size:30px_30px]" />
            <div className="relative">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
