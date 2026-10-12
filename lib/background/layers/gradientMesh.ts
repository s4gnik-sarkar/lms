import { BackgroundConfig } from '../config'

/**
 * Layer 1: Gradient Mesh & Film Grain
 *
 * Renders a deep navy/black base with drifting cyan, blue, and violet
 * radial gradient glows, overlaid with an efficient pre-rendered film grain.
 */
export class GradientMeshLayer {
  private config: BackgroundConfig
  private grainPattern: CanvasPattern | null = null
  private width = 0
  private height = 0

  constructor(config: BackgroundConfig) {
    this.config = config
    this.createGrainPattern()
  }

  /**
   * Pre-generates an offscreen film-grain pattern to maintain steady 60fps.
   */
  private createGrainPattern() {
    if (typeof document === 'undefined') return
    const size = this.config.mesh.grainTileSize
    const offscreen = document.createElement('canvas')
    offscreen.width = size
    offscreen.height = size
    const ctx = offscreen.getContext('2d')
    if (!ctx) return

    const imgData = ctx.createImageData(size, size)
    const data = imgData.data

    for (let i = 0; i < data.length; i += 4) {
      // Random monochrome noise
      const val = Math.floor(Math.random() * 255)
      data[i] = val     // Red
      data[i + 1] = val // Green
      data[i + 2] = val // Blue
      data[i + 3] = 40  // Base tile alpha
    }

    ctx.putImageData(imgData, 0, 0)
    this.grainPattern = ctx.createPattern(offscreen, 'repeat')
  }

  public resize(width: number, height: number) {
    this.width = width
    this.height = height
  }

  /**
   * Renders the gradient mesh and grain.
   * @param ctx - 2D context of the base canvas
   * @param time - Total elapsed time in milliseconds
   * @param isStatic - When true (prefers-reduced-motion), renders a fixed beauty frame
   */
  public render(ctx: CanvasRenderingContext2D, time: number, isStatic = false) {
    const { width, height } = this
    if (width === 0 || height === 0) return

    // 1. Clear & fill deep background
    ctx.fillStyle = this.config.colors.background
    ctx.fillRect(0, 0, width, height)

    // 2. Render drifting radial gradient blobs
    const maxDim = Math.max(width, height)
    const baseSpeed = this.config.mesh.baseSpeed
    const t = isStatic ? 1200 : time * baseSpeed

    ctx.save()
    ctx.globalCompositeOperation = 'screen'

    for (let i = 0; i < this.config.mesh.blobs.length; i++) {
      const blob = this.config.mesh.blobs[i]
      // Harmonic drifting path
      const cx = width * (0.5 + 0.32 * Math.sin(t * blob.speedX + blob.phase))
      const cy = height * (0.5 + 0.32 * Math.cos(t * blob.speedY + blob.phase))
      const radius = maxDim * blob.radius

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      grad.addColorStop(0, blob.color)
      grad.addColorStop(0.5, blob.color + '44') // semi-transparent
      grad.addColorStop(1, 'transparent')

      ctx.globalAlpha = blob.alpha
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    // 3. Render subtle film grain overlay
    if (this.grainPattern) {
      ctx.save()
      ctx.globalAlpha = this.config.mesh.grainIntensity
      ctx.fillStyle = this.grainPattern
      ctx.fillRect(0, 0, width, height)
      ctx.restore()
    }
  }
}

