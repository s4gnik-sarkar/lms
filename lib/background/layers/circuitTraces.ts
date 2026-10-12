import { BackgroundConfig } from '../config'

interface Point {
  x: number
  y: number
}

interface Segment {
  p1: Point
  p2: Point
  length: number
}

interface Trace {
  points: Point[]
  segments: Segment[]
  totalLength: number
  hasStartPad: boolean
  hasEndVia: boolean
  isSquarePad: boolean
}

interface Pulse {
  traceIndex: number
  progress: number // 0.0 to 1.0
  speed: number    // progress / second
  color: string
  trailLength: number
}

/**
 * Layer 2: PCB Circuit Traces & Traveling Light Pulses
 *
 * Procedurally generates authentic PCB traces (orthogonal and 45° bends)
 * with solder pads, through-hole vias, and glowing electrical pulses.
 * Features background-only cursor illumination.
 */
export class CircuitTracesLayer {
  private config: BackgroundConfig
  private traces: Trace[] = []
  private pulses: Pulse[] = []
  private width = 0
  private height = 0
  private isMobile = false

  constructor(config: BackgroundConfig) {
    this.config = config
  }

  public resize(width: number, height: number) {
    this.width = width
    this.height = height
    this.isMobile = width < 768
    this.generateTraces()
    this.initPulses()
  }

  /**
   * Procedural generator for realistic PCB routes with 45° chamfers.
   */
  private generateTraces() {
    const { width, height } = this
    if (width === 0 || height === 0) return

    this.traces = []
    const count = this.isMobile
      ? this.config.traces.mobileDensity
      : this.config.traces.desktopDensity

    // Grid snapping for clean PCB appearance
    const snap = 16
    const snapTo = (val: number) => Math.round(val / snap) * snap

    for (let i = 0; i < count; i++) {
      const points: Point[] = []

      // Start position (distributed across the viewport with margins)
      let currentX = snapTo(Math.random() * (width - 80) + 40)
      let currentY = snapTo(Math.random() * (height - 80) + 40)
      points.push({ x: currentX, y: currentY })

      // Number of bends (2 to 4 segments per trace)
      const segmentsCount = 2 + Math.floor(Math.random() * 3)
      let isHorizontal = Math.random() > 0.5

      for (let s = 0; s < segmentsCount; s++) {
        // Orthogonal segment
        const dist = snapTo((Math.random() * 120 + 40) * (Math.random() > 0.5 ? 1 : -1))
        if (isHorizontal) {
          currentX = Math.max(20, Math.min(width - 20, currentX + dist))
        } else {
          currentY = Math.max(20, Math.min(height - 20, currentY + dist))
        }
        points.push({ x: currentX, y: currentY })

        // Optional 45-degree bend
        if (Math.random() > 0.4 && s < segmentsCount - 1) {
          const diagonalDist = snapTo((Math.random() * 60 + 30) * (Math.random() > 0.5 ? 1 : -1))
          const dirY = Math.random() > 0.5 ? 1 : -1
          currentX = Math.max(20, Math.min(width - 20, currentX + diagonalDist))
          currentY = Math.max(20, Math.min(height - 20, currentY + Math.abs(diagonalDist) * dirY))
          points.push({ x: currentX, y: currentY })
        }

        isHorizontal = !isHorizontal
      }

      // Calculate segment lengths and cumulative totals
      const segments: Segment[] = []
      let totalLength = 0
      for (let p = 0; p < points.length - 1; p++) {
        const p1 = points[p]
        const p2 = points[p + 1]
        const length = Math.hypot(p2.x - p1.x, p2.y - p1.y)
        segments.push({ p1, p2, length })
        totalLength += length
      }

      if (totalLength > 40) {
        this.traces.push({
          points,
          segments,
          totalLength,
          hasStartPad: Math.random() > 0.3,
          hasEndVia: Math.random() > 0.2,
          isSquarePad: Math.random() > 0.5,
        })
      }
    }
  }

  /**
   * Initializes light pulses traveling along randomly chosen traces.
   */
  private initPulses() {
    this.pulses = []
    if (this.traces.length === 0) return

    const pulseCount = this.isMobile
      ? this.config.traces.pulseCountMobile
      : this.config.traces.pulseCountDesktop

    const colors = [
      this.config.colors.cyan,
      this.config.colors.blue,
      this.config.colors.violet,
      '#FFFFFF',
    ]

    for (let i = 0; i < pulseCount; i++) {
      const traceIndex = Math.floor(Math.random() * this.traces.length)
      const speed =
        this.config.traces.minSpeed +
        Math.random() * (this.config.traces.maxSpeed - this.config.traces.minSpeed)

      this.pulses.push({
        traceIndex,
        progress: Math.random(), // Staggered initial position
        speed: speed * (Math.random() > 0.5 ? 1 : -1), // Can move both ways
        color: colors[Math.floor(Math.random() * colors.length)],
        trailLength: this.config.traces.pulseTrailLength,
      })
    }
  }

  /**
   * Computes an (x, y) coordinate along a polyline given progress 0.0 to 1.0.
   */
  private getPointAtProgress(trace: Trace, progress: number): Point {
    const targetDist = Math.max(0, Math.min(1, progress)) * trace.totalLength
    let accumulated = 0

    for (const seg of trace.segments) {
      if (accumulated + seg.length >= targetDist) {
        const remaining = targetDist - accumulated
        const ratio = seg.length > 0 ? remaining / seg.length : 0
        return {
          x: seg.p1.x + (seg.p2.x - seg.p1.x) * ratio,
          y: seg.p1.y + (seg.p2.y - seg.p1.y) * ratio,
        }
      }
      accumulated += seg.length
    }

    return trace.points[trace.points.length - 1]
  }

  /**
   * Renders static traces, pads, interactive mouse illumination, and traveling pulses.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    deltaTime: number,
    mouseX: number,
    mouseY: number,
    isStatic = false
  ) {
    const { width, height } = this
    if (width === 0 || height === 0) return

    ctx.clearRect(0, 0, width, height)

    // 1. Soft radial mouse glow behind traces
    if (mouseX > 0 && mouseY > 0 && !isStatic) {
      const mouseGrad = ctx.createRadialGradient(
        mouseX,
        mouseY,
        0,
        mouseX,
        mouseY,
        this.config.traces.mouseGlowRadius
      )
      mouseGrad.addColorStop(0, 'rgba(0, 229, 255, 0.16)')
      mouseGrad.addColorStop(0.5, 'rgba(41, 121, 255, 0.07)')
      mouseGrad.addColorStop(1, 'transparent')

      ctx.fillStyle = mouseGrad
      ctx.beginPath()
      ctx.arc(mouseX, mouseY, this.config.traces.mouseGlowRadius, 0, Math.PI * 2)
      ctx.fill()
    }

    // 2. Render all static trace paths
    ctx.lineWidth = this.config.traces.lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (const trace of this.traces) {
      // Test distance to mouse for local brightness boosting
      let minMouseDist = Infinity
      if (mouseX > 0 && mouseY > 0 && !isStatic) {
        for (const pt of trace.points) {
          const d = Math.hypot(pt.x - mouseX, pt.y - mouseY)
          if (d < minMouseDist) minMouseDist = d
        }
      }

      const isNearMouse = minMouseDist < this.config.traces.mouseGlowRadius
      const mouseFactor = isNearMouse
        ? 1 + (1 - minMouseDist / this.config.traces.mouseGlowRadius) * 2.2
        : 1

      ctx.strokeStyle = isNearMouse
        ? `rgba(0, 229, 255, ${Math.min(0.8, 0.14 * mouseFactor)})`
        : this.config.colors.traceBase

      ctx.beginPath()
      ctx.moveTo(trace.points[0].x, trace.points[0].y)
      for (let i = 1; i < trace.points.length; i++) {
        ctx.lineTo(trace.points[i].x, trace.points[i].y)
      }
      ctx.stroke()

      // Render Start Node Pad
      if (trace.hasStartPad) {
        const startPt = trace.points[0]
        ctx.fillStyle = this.config.colors.nodePad
        ctx.globalAlpha = isNearMouse ? 0.9 : 0.45

        if (trace.isSquarePad) {
          const padSize = this.config.traces.padRadius * 1.5
          ctx.fillRect(startPt.x - padSize / 2, startPt.y - padSize / 2, padSize, padSize)
        } else {
          ctx.beginPath()
          ctx.arc(startPt.x, startPt.y, this.config.traces.padRadius, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1.0
      }

      // Render End Via (through-hole ring)
      if (trace.hasEndVia) {
        const endPt = trace.points[trace.points.length - 1]
        ctx.fillStyle = this.config.colors.viaDot
        ctx.globalAlpha = isNearMouse ? 0.9 : 0.5
        ctx.beginPath()
        ctx.arc(endPt.x, endPt.y, this.config.traces.viaRadius, 0, Math.PI * 2)
        ctx.fill()

        // Tiny inner hole for authentic PCB via appearance
        ctx.fillStyle = this.config.colors.background
        ctx.beginPath()
        ctx.arc(endPt.x, endPt.y, this.config.traces.viaRadius * 0.45, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1.0
      }
    }

    // 3. Render traveling light pulses with glowing tails
    if (this.traces.length > 0) {
      for (const pulse of this.pulses) {
        const trace = this.traces[pulse.traceIndex]
        if (!trace) continue

        // Update progress if not reduced-motion
        if (!isStatic) {
          pulse.progress += pulse.speed * (deltaTime / 1000)
          if (pulse.progress > 1.0) pulse.progress -= 1.0
          if (pulse.progress < 0.0) pulse.progress += 1.0
        }

        // Draw segmented fading trail
        const steps = 7
        for (let s = steps; s >= 0; s--) {
          const trailOffset = (s / steps) * pulse.trailLength * Math.sign(pulse.speed || 1)
          let sampleProg = pulse.progress - trailOffset
          if (sampleProg < 0) sampleProg += 1
          if (sampleProg > 1) sampleProg -= 1

          const pos = this.getPointAtProgress(trace, sampleProg)
          const alpha = (1 - s / steps) * 0.85
          const radius = (1 - s / steps) * 2.8 + 1.2

          ctx.fillStyle = pulse.color
          ctx.globalAlpha = alpha
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
          ctx.fill()
        }

        // Pulse head bright core
        const headPos = this.getPointAtProgress(trace, pulse.progress)
        ctx.fillStyle = '#FFFFFF'
        ctx.globalAlpha = 0.95
        ctx.beginPath()
        ctx.arc(headPos.x, headPos.y, 2.2, 0, Math.PI * 2)
        ctx.fill()

        ctx.globalAlpha = 1.0
      }
    }
  }
}

