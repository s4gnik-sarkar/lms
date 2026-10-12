import { BackgroundConfig } from '../config'

interface HudElement {
  x: number
  y: number
  type: 'crosshair' | 'gear' | 'readout'
  label?: string
  sublabel?: string
  gearRadius?: number
  teeth?: number
  phase: number
}

/**
 * Layer 3: Blueprint Grid & Technical HUD Elements
 *
 * Renders a faint engineering grid with slow parallax drift,
 * accompanied by rotating micro-gears, targeting crosshairs,
 * and tech telemetry readouts that subtly fade in and out.
 */
export class BlueprintGridLayer {
  private config: BackgroundConfig
  private elements: HudElement[] = []
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
    this.initHudElements()
  }

  /**
   * Generates technical HUD elements positioned around outer edges
   * to avoid obstructing central headline typography.
   */
  private initHudElements() {
    const { width, height } = this
    if (width === 0 || height === 0) return

    this.elements = []
    const count = this.isMobile
      ? this.config.blueprint.hudCountMobile
      : this.config.blueprint.hudCountDesktop

    const readouts = [
      { label: 'SYS_STATUS: NOMINAL', sublabel: 'CORE_TEMP 38.4°C' },
      { label: 'BUS_CLK: 400 MHz', sublabel: 'PACKET_LOSS: 0.00%' },
      { label: 'MOTOR_DRV_01: ARMED', sublabel: 'PWM_FREQ 20 kHz' },
      { label: 'CAN_BUS // ID_0x7F', sublabel: 'BAUD 1.0 Mbps' },
      { label: 'CALIBRATION: 99.8%', sublabel: 'ENCODER: QUAD_OPTICAL' },
    ]

    for (let i = 0; i < count; i++) {
      // Keep clear of center (0.25 to 0.75 horizontally, 0.35 to 0.65 vertically)
      const onLeftOrRight = Math.random() > 0.5
      const x = onLeftOrRight
        ? Math.random() * (width * 0.22) + 24
        : width - (Math.random() * (width * 0.22) + 24)

      const y = Math.random() * (height - 140) + 70

      const typeRand = Math.random()
      const type: 'crosshair' | 'gear' | 'readout' =
        typeRand < 0.35 ? 'crosshair' : typeRand < 0.65 ? 'gear' : 'readout'

      const readoutSample = readouts[i % readouts.length]

      this.elements.push({
        x,
        y,
        type,
        label: readoutSample.label,
        sublabel: readoutSample.sublabel,
        gearRadius: 10 + Math.random() * 6,
        teeth: 8,
        phase: Math.random() * Math.PI * 2,
      })
    }
  }

  /**
   * Helper to draw a procedural micro-gear.
   */
  private drawGear(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    teeth: number,
    angle: number
  ) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)

    const innerRadius = radius * 0.75
    const holeRadius = radius * 0.35
    const step = (Math.PI * 2) / (teeth * 2)

    ctx.beginPath()
    for (let i = 0; i < teeth * 2; i++) {
      const r = i % 2 === 0 ? radius : innerRadius
      const a = i * step
      const px = Math.cos(a) * r
      const py = Math.sin(a) * r
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.stroke()

    // Inner axle hole
    ctx.beginPath()
    ctx.arc(0, 0, holeRadius, 0, Math.PI * 2)
    ctx.stroke()

    ctx.restore()
  }

  /**
   * Helper to draw a precision targeting crosshair.
   */
  private drawCrosshair(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const size = 12
    const corner = 4

    // Center crosshair
    ctx.beginPath()
    ctx.moveTo(x - size, y)
    ctx.lineTo(x + size, y)
    ctx.moveTo(x, y - size)
    ctx.lineTo(x, y + size)
    ctx.stroke()

    // Reticle brackets
    ctx.beginPath()
    // Top-left bracket
    ctx.moveTo(x - size, y - size + corner)
    ctx.lineTo(x - size, y - size)
    ctx.lineTo(x - size + corner, y - size)
    // Bottom-right bracket
    ctx.moveTo(x + size, y + size - corner)
    ctx.lineTo(x + size, y + size)
    ctx.lineTo(x + size - corner, y + size)
    ctx.stroke()
  }

  /**
   * Renders the blueprint grid and floating HUD elements.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    time: number,
    mouseX: number,
    mouseY: number,
    isStatic = false
  ) {
    const { width, height } = this
    if (width === 0 || height === 0) return

    ctx.clearRect(0, 0, width, height)

    // 1. Grid Parallax calculations
    const pFactor = this.config.blueprint.parallaxFactor
    const mouseShiftX = (mouseX - width / 2) * pFactor
    const mouseShiftY = (mouseY - height / 2) * pFactor
    const driftX = isStatic ? 0 : (time * 0.004) % this.config.blueprint.gridSize
    const driftY = isStatic ? 0 : (time * 0.002) % this.config.blueprint.gridSize

    const offsetX = (mouseShiftX + driftX) % this.config.blueprint.gridSize
    const offsetY = (mouseShiftY + driftY) % this.config.blueprint.gridSize
    const cellSize = this.config.blueprint.gridSize
    const majorMult = this.config.blueprint.majorGridMultiple

    // 2. Draw Minor and Major Grid lines
    ctx.lineWidth = 1

    // Vertical lines
    for (let x = -cellSize + offsetX; x <= width + cellSize; x += cellSize) {
      const isMajor = Math.round((x - offsetX) / cellSize) % majorMult === 0
      ctx.strokeStyle = isMajor
        ? this.config.colors.gridMajor
        : this.config.colors.gridMinor

      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Horizontal lines
    for (let y = -cellSize + offsetY; y <= height + cellSize; y += cellSize) {
      const isMajor = Math.round((y - offsetY) / cellSize) % majorMult === 0
      ctx.strokeStyle = isMajor
        ? this.config.colors.gridMajor
        : this.config.colors.gridMinor

      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // 3. Draw Floating HUD Technical Details
    const tSec = isStatic ? 2.5 : time / 1000

    for (const el of this.elements) {
      // Smooth sinusoidal pulsing fade in and out
      const fadePeriod = this.config.blueprint.hudFadeDuration
      const rawAlpha = Math.sin(el.phase + (tSec * Math.PI * 2) / fadePeriod)
      const alpha = Math.max(0, rawAlpha * 0.65) // 0 to 0.65

      if (alpha <= 0.01) continue

      ctx.save()
      ctx.globalAlpha = alpha

      // Parallax slight offset on elements
      const posX = el.x + mouseShiftX * 0.4
      const posY = el.y + mouseShiftY * 0.4

      if (el.type === 'crosshair') {
        ctx.strokeStyle = this.config.colors.hudCrosshair
        this.drawCrosshair(ctx, posX, posY)

        // Coordinates tag
        ctx.fillStyle = this.config.colors.hudText
        ctx.font = '10px "Share Tech Mono", monospace'
        ctx.fillText(`+LOC [${Math.round(posX)}, ${Math.round(posY)}]`, posX + 16, posY + 4)
      } else if (el.type === 'gear' && el.gearRadius && el.teeth) {
        ctx.strokeStyle = this.config.colors.cyan
        const angle = isStatic ? el.phase : el.phase + time * this.config.blueprint.gearRotateSpeed
        this.drawGear(ctx, posX, posY, el.gearRadius, el.teeth, angle)
      } else if (el.type === 'readout') {
        ctx.fillStyle = this.config.colors.hudText
        ctx.font = '11px "Share Tech Mono", monospace'

        // Small indicator box
        ctx.strokeStyle = this.config.colors.cyan
        ctx.strokeRect(posX - 4, posY - 10, 5, 5)

        if (el.label) ctx.fillText(el.label, posX + 8, posY - 4)
        if (el.sublabel) {
          ctx.fillStyle = this.config.colors.hudCrosshair
          ctx.font = '9px "Share Tech Mono", monospace'
          ctx.fillText(el.sublabel, posX + 8, posY + 8)
        }
      }

      ctx.restore()
    }
  }
}

