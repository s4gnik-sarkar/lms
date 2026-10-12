/**
 * Tunable Configuration for Automata Academy Hero Background
 *
 * All parameters governing colors, animations, densities, and performance
 * thresholds are centralized here for easy tuning.
 */

export const backgroundConfig = {
  /** Capped device pixel ratio to maintain 60fps on high-DPI screens */
  dprMax: 2,

  /** Core robotics color palette */
  colors: {
    background: '#040711', // Deep navy/black base
    cyan: '#00E5FF',       // Neon cyan accent
    blue: '#2979FF',       // Electric blue glow
    violet: '#7C4DFF',     // Circuit accent violet
    traceBase: 'rgba(0, 229, 255, 0.20)',
    traceBright: 'rgba(0, 229, 255, 0.90)',
    viaDot: '#00E5FF',
    nodePad: '#2979FF',
    gridMinor: 'rgba(0, 229, 255, 0.08)',
    gridMajor: 'rgba(41, 121, 255, 0.18)',
    hudText: 'rgba(0, 229, 255, 0.75)',
    hudCrosshair: 'rgba(124, 77, 255, 0.65)',
  },

  /** Layer 1: Slowly morphing gradient mesh & film-grain overlay */
  mesh: {
    /** Overall speed multiplier for blob drift */
    baseSpeed: 0.0006,
    /** Grain noise intensity (0.0 to 1.0) */
    grainIntensity: 0.045,
    /** Size of the cached offscreen noise canvas tile in pixels */
    grainTileSize: 128,
    /** Drifting light blobs */
    blobs: [
      { color: '#00E5FF', alpha: 0.32, radius: 0.48, speedX: 1.0, speedY: 0.7, phase: 0 },
      { color: '#2979FF', alpha: 0.35, radius: 0.52, speedX: 0.8, speedY: 1.1, phase: 2.1 },
      { color: '#7C4DFF', alpha: 0.28, radius: 0.45, speedX: 1.2, speedY: 0.6, phase: 4.2 },
      { color: '#00E5FF', alpha: 0.25, radius: 0.40, speedX: 0.7, speedY: 0.9, phase: 1.5 },
    ],
  },

  /** Layer 2: Procedural PCB Circuit Traces & traveling light pulses */
  traces: {
    /** Number of trace paths to generate */
    desktopDensity: 32,
    mobileDensity: 14,
    /** Active traveling pulse counts */
    pulseCountDesktop: 10,
    pulseCountMobile: 4,
    /** Pulse traveling speed range (percentage of path per second) */
    minSpeed: 0.12,
    maxSpeed: 0.35,
    /** Length of the fading light trail (0.0 to 1.0 of the trace length) */
    pulseTrailLength: 0.18,
    /** Dimensions of PCB elements */
    lineWidth: 1.2,
    viaRadius: 2.5,
    padRadius: 4.5,
    /** Cursor interaction radius and brightness boost */
    mouseGlowRadius: 200,
    mouseBoostFactor: 2.8,
  },

  /** Layer 3: Blueprint Grid & floating technical HUD details */
  blueprint: {
    /** Grid cell width/height in CSS pixels */
    gridSize: 48,
    /** Every Nth line is drawn as a major grid line */
    majorGridMultiple: 4,
    /** Parallax movement factor relative to cursor movement */
    parallaxFactor: 0.025,
    /** Number of floating technical HUD markers */
    hudCountDesktop: 7,
    hudCountMobile: 3,
    /** Fade in / out cycle duration in seconds */
    hudFadeDuration: 4.5,
    /** Gear rotation speed in radians per frame */
    gearRotateSpeed: 0.008,
  },
} as const

export type BackgroundConfig = typeof backgroundConfig

