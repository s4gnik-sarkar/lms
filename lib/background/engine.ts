import { backgroundConfig, BackgroundConfig } from './config'
import { GradientMeshLayer } from './layers/gradientMesh'
import { CircuitTracesLayer } from './layers/circuitTraces'
import { BlueprintGridLayer } from './layers/blueprintGrid'

export interface BackgroundCanvases {
  base: HTMLCanvasElement
  traces: HTMLCanvasElement
  grid: HTMLCanvasElement
}

/**
 * BackgroundEngine
 *
 * Coordinates the 3 stacked canvas layers:
 * 1. Base Gradient Mesh & Film Grain
 * 2. Circuit Traces & Pulses
 * 3. Blueprint Grid & HUD Telemetry
 *
 * Handles rAF loop, DPR scaling (capped at 2), debounced resize,
 * visibility change pauses, mouse tracking, and prefers-reduced-motion.
 */
export class BackgroundEngine {
  private canvases: BackgroundCanvases
  private ctxBase: CanvasRenderingContext2D | null = null
  private ctxTraces: CanvasRenderingContext2D | null = null
  private ctxGrid: CanvasRenderingContext2D | null = null

  private config: BackgroundConfig = backgroundConfig
  private layerMesh: GradientMeshLayer
  private layerTraces: CircuitTracesLayer
  private layerGrid: BlueprintGridLayer

  private animationFrameId: number | null = null
  private lastTimestamp = 0
  private isRunning = false
  private isVisible = true
  private prefersReducedMotion = false

  // Mouse coordinates with smooth damping
  private targetMouseX = -1
  private targetMouseY = -1
  private currentMouseX = -1
  private currentMouseY = -1

  private resizeObserver: ResizeObserver | null = null
  private resizeTimeout: NodeJS.Timeout | null = null

  constructor(canvases: BackgroundCanvases, prefersReducedMotion = false) {
    this.canvases = canvases
    this.prefersReducedMotion = prefersReducedMotion

    this.ctxBase = canvases.base.getContext('2d')
    this.ctxTraces = canvases.traces.getContext('2d')
    this.ctxGrid = canvases.grid.getContext('2d')

    this.layerMesh = new GradientMeshLayer(this.config)
    this.layerTraces = new CircuitTracesLayer(this.config)
    this.layerGrid = new BlueprintGridLayer(this.config)
  }

  /**
   * Initializes listeners and resizes canvases.
   */
  public init(container: HTMLElement) {
    if (typeof window === 'undefined') return

    this.handleResize(container)

    // Debounced Resize Observer
    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeTimeout) clearTimeout(this.resizeTimeout)
      this.resizeTimeout = setTimeout(() => {
        this.handleResize(container)
        if (this.prefersReducedMotion) {
          this.renderFrame(performance.now(), true)
        }
      }, 100)
    })
    this.resizeObserver.observe(container)

    // Mouse / Pointer tracking
    window.addEventListener('pointermove', this.onPointerMove, { passive: true })

    // Tab visibility handling
    document.addEventListener('visibilitychange', this.onVisibilityChange)

    if (this.prefersReducedMotion) {
      // Single static beauty frame for accessibility
      this.renderFrame(performance.now(), true)
    } else {
      this.start()
    }
  }

  private onPointerMove = (e: PointerEvent) => {
    this.targetMouseX = e.clientX
    this.targetMouseY = e.clientY

    // Instant initial capture if unset
    if (this.currentMouseX < 0) {
      this.currentMouseX = e.clientX
      this.currentMouseY = e.clientY
    }
  }

  private onVisibilityChange = () => {
    if (document.hidden) {
      this.isVisible = false
      this.stop()
    } else {
      this.isVisible = true
      this.lastTimestamp = performance.now()
      if (!this.prefersReducedMotion) {
        this.start()
      }
    }
  }

  /**
   * Adapts canvas buffers to display size multiplied by capped DPR.
   */
  private handleResize(container: HTMLElement) {
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, this.config.dprMax)

    const setupCanvas = (
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D | null
    ) => {
      if (!ctx) return
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }

    setupCanvas(this.canvases.base, this.ctxBase)
    setupCanvas(this.canvases.traces, this.ctxTraces)
    setupCanvas(this.canvases.grid, this.ctxGrid)

    this.layerMesh.resize(width, height)
    this.layerTraces.resize(width, height)
    this.layerGrid.resize(width, height)
  }

  public start() {
    if (this.isRunning || this.prefersReducedMotion) return
    this.isRunning = true
    this.lastTimestamp = performance.now()
    this.loop(this.lastTimestamp)
  }

  public stop() {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private loop = (timestamp: number) => {
    if (!this.isRunning) return

    const deltaTime = Math.min(timestamp - this.lastTimestamp, 64) // cap delta to avoid jumps
    this.lastTimestamp = timestamp

    // Smooth lerp mouse coordinates toward target
    if (this.targetMouseX >= 0) {
      this.currentMouseX += (this.targetMouseX - this.currentMouseX) * 0.12
      this.currentMouseY += (this.targetMouseY - this.currentMouseY) * 0.12
    }

    this.renderFrame(timestamp, false, deltaTime)

    this.animationFrameId = requestAnimationFrame(this.loop)
  }

  /**
   * Renders a frame across all 3 canvas contexts.
   */
  private renderFrame(timestamp: number, isStatic: boolean, deltaTime = 16) {
    if (this.ctxBase) {
      this.layerMesh.render(this.ctxBase, timestamp, isStatic)
    }

    if (this.ctxTraces) {
      this.layerTraces.render(
        this.ctxTraces,
        deltaTime,
        this.currentMouseX,
        this.currentMouseY,
        isStatic
      )
    }

    if (this.ctxGrid) {
      this.layerGrid.render(
        this.ctxGrid,
        timestamp,
        this.currentMouseX,
        this.currentMouseY,
        isStatic
      )
    }
  }

  /**
   * Clean up all animation frames, observers, and event listeners.
   */
  public destroy() {
    this.stop()
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout)
    if (this.resizeObserver) this.resizeObserver.disconnect()

    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', this.onPointerMove)
      document.removeEventListener('visibilitychange', this.onVisibilityChange)
    }
  }
}

