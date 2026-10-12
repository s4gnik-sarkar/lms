import { HeroBackground } from './HeroBackground'

/**
 * Hero Section (Server Component)
 *
 * Renders the primary landing typography and action buttons on the server.
 * Mounts the client-side HeroBackground canvas layers behind all text.
 */
export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16 overflow-hidden">
      {/* 3-Layer Animated Canvas Background (Client Component) */}
      <HeroBackground />

      {/* Hero Content Container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
        {/* Monospace Tag Line */}
        <div className="font-mono text-[9px] min-[380px]:text-[10px] sm:text-xs md:text-sm tracking-[0.08em] min-[380px]:tracking-[0.14em] sm:tracking-[0.25em] text-[#00E5FF] uppercase mb-4 sm:mb-6 px-2.5 py-1 sm:px-3.5 sm:py-1.5 border border-[#00E5FF]/25 rounded-full bg-[#00E5FF]/5 backdrop-blur-xs flex items-center gap-1.5 sm:gap-2 shadow-[0_0_12px_rgba(0,229,255,0.15)] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse shrink-0" />
          <span>{'// ROBOTICS LEARNING PLATFORM'}</span>
        </div>

        {/* Headline with Orbitron, Wide Tracking, Neon Glow, and Subtle Flicker */}
        <h1 className="font-display font-black text-white uppercase tracking-wide sm:tracking-wider text-[clamp(1.22rem,5.4vw,2.2rem)] sm:text-[clamp(2.15rem,5.5vw+0.5rem,4.5rem)] leading-[1.15] mb-5 sm:mb-6 select-none headline-flicker neon-glow-cyan max-w-4xl">
          <span className="block sm:inline">BUILD ROBOTS. </span>
          <span className="block sm:inline">LEARN BY DOING.</span>
        </h1>

        {/* Subheadline with Rajdhani */}
        <p className="font-body font-medium text-slate-300 text-sm sm:text-xl md:text-2xl tracking-wide max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
          From your first circuit to autonomous machines.
        </p>

        {/* Action Buttons with Neon Borders and Glow */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-xs sm:max-w-none">
          {/* Primary Action Button */}
          <button
            type="button"
            className="neon-btn-primary w-full sm:w-auto px-8 py-3.5 rounded-md font-body font-bold text-base sm:text-lg text-white tracking-wider cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <span>Start Learning</span>
            <span className="text-[#00E5FF] font-mono text-sm">→</span>
          </button>

          {/* Secondary Action Button */}
          <button
            type="button"
            className="neon-btn-secondary w-full sm:w-auto px-8 py-3.5 rounded-md font-body font-semibold text-base sm:text-lg text-slate-300 tracking-wider cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <span>Explore Courses</span>
          </button>
        </div>
      </div>
    </section>
  )
}

