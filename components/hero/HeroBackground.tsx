'use client'

import { useEffect, useRef } from 'react'
import { BackgroundEngine } from '@/lib/background/engine'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * HeroBackground Client Component
 *
 * Mounts 3 stacked Canvas 2D layers (Base Mesh, PCB Circuit Traces, Blueprint Grid)
 * with a dark vignette overlay ensuring strong contrast and readability.
 * All animation loops and event listeners are cleaned up safely on unmount.
 */
export function HeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasBaseRef = useRef<HTMLCanvasElement>(null)
  const canvasTracesRef = useRef<HTMLCanvasElement>(null)
  const canvasGridRef = useRef<HTMLCanvasElement>(null)

  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const container = containerRef.current
    const canvasBase = canvasBaseRef.current
    const canvasTraces = canvasTracesRef.current
    const canvasGrid = canvasGridRef.current

    if (!container || !canvasBase || !canvasTraces || !canvasGrid) {
      return
    }

    const engine = new BackgroundEngine(
      {
        base: canvasBase,
        traces: canvasTraces,
        grid: canvasGrid,
      },
      prefersReducedMotion
    )

    engine.init(container)

    return () => {
      engine.destroy()
    }
  }, [prefersReducedMotion])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Layer 1: Base Gradient Mesh & Film Grain */}
      <canvas
        ref={canvasBaseRef}
        className="absolute inset-0 w-full h-full max-w-full max-h-full block"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Layer 2: Middle PCB Circuit Traces & Traveling Light Pulses */}
      <canvas
        ref={canvasTracesRef}
        className="absolute inset-0 w-full h-full max-w-full max-h-full block"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Layer 3: Top Blueprint Grid & Technical HUD Markers */}
      <canvas
        ref={canvasGridRef}
        className="absolute inset-0 w-full h-full max-w-full max-h-full block"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Center Readability Vignette: darkens perimeter and softens center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(4, 7, 17, 0.20) 0%, rgba(4, 7, 17, 0.60) 65%, rgba(4, 7, 17, 0.92) 100%)',
        }}
      />
    </div>
  )
}

