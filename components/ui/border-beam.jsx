import { cn } from '@/lib/utils'

/**
 * BorderBeam — animated glowing beam that travels around a container's border.
 *
 * Style adapted from the magicui / 21st.dev "Border Beam" component, but
 * implemented in pure CSS (rotating conic-gradient masked to a thin ring, see
 * `.border-beam` / `.border-beam-glow` in app/globals.css) so it needs no
 * extra runtime dependency.
 *
 * Usage: render it as the first child of a `relative` container — the beam
 * inherits the container's border-radius automatically.
 *
 * Props:
 * - `duration`: seconds for one full trip around the border.
 * - `thickness`: beam thickness in px.
 * - `colorFrom` / `colorTo`: gradient colors of the beam.
 * - `glow`: drop-shadow blur radius in px.
 */
export function BorderBeam({
  className,
  duration = 4,
  thickness = 1.5,
  colorFrom = '#3b82f6',
  colorTo = '#dbeafe',
  glow = 8,
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit] border-beam-glow',
        className
      )}
      style={{
        '--beam-duration': `${duration}s`,
        '--beam-thickness': `${thickness}px`,
        '--beam-color-from': colorFrom,
        '--beam-color-to': colorTo,
        '--beam-glow': `${glow}px`,
      }}
    >
      <span className="block h-full w-full rounded-[inherit] border-beam" />
    </span>
  )
}
