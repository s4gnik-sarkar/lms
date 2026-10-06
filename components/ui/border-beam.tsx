'use client'

/**
 * Re-export the BorderBeam component and TypeScript types from the 'border-beam' npm package.
 * Marked with 'use client' to ensure seamless Next.js App Router Client Component compatibility.
 */
export {
  BorderBeam,
  default,
  sizePresets,
  sizeThemePresets,
  themeColors,
} from 'border-beam'

export type {
  BorderBeamProps,
  BorderBeamSize,
  BorderBeamTheme,
  BorderBeamColorVariant,
} from 'border-beam'

