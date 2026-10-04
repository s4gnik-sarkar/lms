'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * ThemeProvider wrapper from next-themes.
 * Supplies theme state (light, dark, system) to the entire application.
 */
export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

