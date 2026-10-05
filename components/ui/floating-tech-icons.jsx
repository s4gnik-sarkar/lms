'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import {
  SiJavascript,
  SiTypescript,
  SiHtml5,
  SiCss,
  SiReact,
  SiNextdotjs,
  SiNodedotjs,
  SiPython,
  SiGit,
  SiDocker,
  SiGooglecloud,
  SiArduino,
  SiRaspberrypi,
  SiTailwindcss,
  SiPostgresql,
} from 'react-icons/si'
import { FaAws } from 'react-icons/fa6'

/**
 * List of technical icons with initial coordinate anchors (% of screen),
 * brand highlight colors, display labels, and animation parameters.
 * Coordinates are intentionally kept along the perimeter to frame the center form card.
 */
const TECH_ICONS = [
  // Top-Left Cluster
  {
    name: 'React',
    Icon: SiReact,
    color: '#61DAFB',
    x: 8,
    y: 12,
    size: 26,
    speed: 0.0018,
    phase: 0,
    range: 12,
  },
  {
    name: 'Next.js',
    Icon: SiNextdotjs,
    color: '#FFFFFF',
    x: 22,
    y: 8,
    size: 24,
    speed: 0.0015,
    phase: 1.2,
    range: 10,
  },
  {
    name: 'JavaScript',
    Icon: SiJavascript,
    color: '#F7DF1E',
    x: 6,
    y: 36,
    size: 24,
    speed: 0.002,
    phase: 2.1,
    range: 14,
  },

  // Bottom-Left Cluster
  {
    name: 'Python',
    Icon: SiPython,
    color: '#3776AB',
    x: 8,
    y: 62,
    size: 26,
    speed: 0.0016,
    phase: 3.4,
    range: 12,
  },
  {
    name: 'Node.js',
    Icon: SiNodedotjs,
    color: '#68A063',
    x: 22,
    y: 82,
    size: 25,
    speed: 0.0019,
    phase: 4.2,
    range: 13,
  },
  {
    name: 'Git',
    Icon: SiGit,
    color: '#F05032',
    x: 6,
    y: 86,
    size: 24,
    speed: 0.0017,
    phase: 0.8,
    range: 11,
  },
  {
    name: 'Raspberry Pi',
    Icon: SiRaspberrypi,
    color: '#C51A4A',
    x: 23,
    y: 52,
    size: 23,
    speed: 0.0022,
    phase: 5.1,
    range: 15,
  },

  // Top-Right Cluster
  {
    name: 'TypeScript',
    Icon: SiTypescript,
    color: '#3178C6',
    x: 92,
    y: 14,
    size: 25,
    speed: 0.0017,
    phase: 2.7,
    range: 12,
  },
  {
    name: 'Docker',
    Icon: SiDocker,
    color: '#2496ED',
    x: 77,
    y: 8,
    size: 26,
    speed: 0.0021,
    phase: 1.9,
    range: 14,
  },
  {
    name: 'AWS',
    Icon: FaAws,
    color: '#FF9900',
    x: 93,
    y: 38,
    size: 26,
    speed: 0.0016,
    phase: 3.9,
    range: 11,
  },

  // Bottom-Right Cluster
  {
    name: 'HTML5',
    Icon: SiHtml5,
    color: '#E34F26',
    x: 76,
    y: 82,
    size: 25,
    speed: 0.0018,
    phase: 4.8,
    range: 12,
  },
  {
    name: 'CSS3',
    Icon: SiCss,
    color: '#1572B6',
    x: 92,
    y: 64,
    size: 25,
    speed: 0.002,
    phase: 0.5,
    range: 13,
  },
  {
    name: 'Google Cloud',
    Icon: SiGooglecloud,
    color: '#4285F4',
    x: 91,
    y: 86,
    size: 24,
    speed: 0.0015,
    phase: 2.3,
    range: 10,
  },
  {
    name: 'Arduino',
    Icon: SiArduino,
    color: '#00979D',
    x: 75,
    y: 54,
    size: 24,
    speed: 0.0019,
    phase: 3.1,
    range: 14,
  },

  // Subtle Outer Flanks
  {
    name: 'Tailwind CSS',
    Icon: SiTailwindcss,
    color: '#06B6D4',
    x: 16,
    y: 24,
    size: 23,
    speed: 0.0016,
    phase: 1.5,
    range: 10,
  },
  {
    name: 'PostgreSQL',
    Icon: SiPostgresql,
    color: '#4169E1',
    x: 84,
    y: 26,
    size: 24,
    speed: 0.0022,
    phase: 4.0,
    range: 12,
  },
]

/**
 * FloatingTechIcons Component.
 *
 * Renders an ambient layer of floating developer icons around the perimeter of the screen.
 *
 * Physics & Features:
 * - Autonomous floating via individual sine wave oscillators.
 * - Dynamic cursor repulsion: As mouse approaches, icons gently push away and tilt.
 * - Magnetic spring return: Icons smoothly glide back using LERP (Linear Interpolation).
 * - Interactive glow: Proximity boosts opacity, scale, and illuminates brand colored drop-shadow.
 * - Pointer-events-none overlay guarantees zero obstruction to form inputs and controls.
 */
const emptySubscribe = () => () => {}

export function FloatingTechIcons() {
  const containerRef = useRef(null)
  const itemRefs = useRef([])

  // Store live physics state for each icon (current position, target position, hover intensity)
  const physicsRef = useRef(
    TECH_ICONS.map(() => ({
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,
      glow: 0,
      tiltX: 0,
      tiltY: 0,
    }))
  )

  const mousePos = useRef({ x: -9999, y: -9999 })
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    const handleMouseLeave = () => {
      mousePos.current = { x: -9999, y: -9999 }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseleave', handleMouseLeave)

    let animationFrameId
    const startTime = performance.now()

    // ── Animation Loop ──────────────────────────────────────────────────────────
    function updatePhysics(now) {
      if (!containerRef.current) return
      const elapsed = now - startTime
      const rect = containerRef.current.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      const mouse = mousePos.current
      const INFLUENCE_RADIUS = 190 // pixels around cursor that repel icons
      const MAX_REPULSION = 38 // max pixel pushback away from cursor
      const LERP_FACTOR = 0.07 // spring easing speed (0 = frozen, 1 = instantaneous)

      TECH_ICONS.forEach((icon, i) => {
        const itemEl = itemRefs.current[i]
        const state = physicsRef.current[i]
        if (!itemEl || !state) return

        // 1. Natural ambient floating offset
        const ambientX = Math.cos(elapsed * icon.speed + icon.phase) * (icon.range * 0.6)
        const ambientY = Math.sin(elapsed * icon.speed + icon.phase) * icon.range

        // 2. Compute anchor position in pixels
        const basePixelX = (icon.x / 100) * width
        const basePixelY = (icon.y / 100) * height

        // 3. Compute distance vector from cursor to icon
        const dx = (basePixelX + state.currentX) - mouse.x
        const dy = (basePixelY + state.currentY) - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        let pushX = 0
        let pushY = 0
        let targetGlow = 0
        let targetTiltX = 0
        let targetTiltY = 0

        // 4. Cursor repulsion and tilt calculation
        if (dist < INFLUENCE_RADIUS && dist > 0) {
          const proximity = 1 - dist / INFLUENCE_RADIUS // 0 at edge, 1 at cursor
          const force = Math.pow(proximity, 1.8) * MAX_REPULSION

          const angle = Math.atan2(dy, dx)
          pushX = Math.cos(angle) * force
          pushY = Math.sin(angle) * force

          targetGlow = proximity
          targetTiltX = (dy / dist) * -18 * proximity
          targetTiltY = (dx / dist) * 18 * proximity
        }

        // 5. Spring target position = ambient drift + cursor pushback
        state.targetX = ambientX + pushX
        state.targetY = ambientY + pushY

        // 6. Linear Interpolation (LERP) for organic, buttery motion
        state.currentX += (state.targetX - state.currentX) * LERP_FACTOR
        state.currentY += (state.targetY - state.currentY) * LERP_FACTOR
        state.glow += (targetGlow - state.glow) * LERP_FACTOR
        state.tiltX += (targetTiltX - state.tiltX) * LERP_FACTOR
        state.tiltY += (targetTiltY - state.tiltY) * LERP_FACTOR

        // 7. Apply GPU-accelerated CSS transform and dynamic illumination
        const scale = 1 + state.glow * 0.12
        itemEl.style.transform = `translate3d(${state.currentX.toFixed(2)}px, ${state.currentY.toFixed(2)}px, 0) scale(${scale.toFixed(3)}) rotateX(${state.tiltX.toFixed(1)}deg) rotateY(${state.tiltY.toFixed(1)}deg)`

        if (state.glow > 0.05) {
          itemEl.style.borderColor = `${icon.color}${Math.round(state.glow * 180).toString(16).padStart(2, '0')}`
          itemEl.style.boxShadow = `0 0 ${Math.round(state.glow * 24)}px ${icon.color}40, 0 10px 25px -5px rgba(0,0,0,0.5)`
          itemEl.style.opacity = `${(0.75 + state.glow * 0.25).toFixed(2)}`
        } else {
          itemEl.style.borderColor = 'rgba(255, 255, 255, 0.08)'
          itemEl.style.boxShadow = '0 8px 24px -4px rgba(0, 0, 0, 0.4)'
          itemEl.style.opacity = '0.72'
        }
      })

      animationFrameId = requestAnimationFrame(updatePhysics)
    }

    animationFrameId = requestAnimationFrame(updatePhysics)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [])

  if (!mounted) return null

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden select-none"
    >
      {TECH_ICONS.map((tech, i) => {
        const IconComponent = tech.Icon
        return (
          <div
            key={tech.name}
            ref={(el) => {
              itemRefs.current[i] = el
            }}
            style={{
              left: `${tech.x}%`,
              top: `${tech.y}%`,
            }}
            className="group absolute -translate-x-1/2 -translate-y-1/2 will-change-transform"
          >
            {/* Frosted Glass Badge */}
            <div className="relative flex flex-col items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-black/40 px-3.5 py-3 shadow-lg backdrop-blur-md transition-colors duration-200">
              {/* Vibrant Brand Tech Icon */}
              <IconComponent
                size={tech.size}
                style={{ color: tech.color }}
                className="filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
              />

              {/* Tech Name Label */}
              <span className="text-[10px] font-semibold tracking-wider text-white/60 transition-colors group-hover:text-white/90">
                {tech.name}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
