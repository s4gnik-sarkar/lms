'use client'

import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {}
  }
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  mediaQuery.addEventListener('change', callback)
  return () => {
    mediaQuery.removeEventListener('change', callback)
  }
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getServerSnapshot(): boolean {
  return false
}

/**
 * Hook to detect whether the user has requested reduced motion in their system preferences.
 * Uses useSyncExternalStore for tear-free, SSR-safe external subscription.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
