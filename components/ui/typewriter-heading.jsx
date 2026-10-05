'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

/**
 * TypewriterHeading Component
 *
 * Types out an array of phrases character-by-character, pauses, backspaces,
 * and loops to the next phrase.
 *
 * Accessibility & Performance:
 * - Visually hidden `sr-only` text ensures screen readers read the full phrase
 *   rather than announcing every individual keystroke.
 * - Detects `prefers-reduced-motion` to render full static text for users sensitive to motion.
 * - Managed via clean `setTimeout` handles with unmount cleanup to avoid memory leaks.
 *
 * Props:
 * - `phrases`: Array of string headlines to cycle through.
 * - `badge`: Optional small pill tag above the headline.
 * - `subtitle`: Optional descriptive paragraph below the headline.
 * - `className`: Optional wrapper class name.
 */
export function TypewriterHeading({
  phrases = [
    'Learn to code. Build real things.',
    'From HTML to the cloud.',
    'Master JavaScript, React & Python.',
    'Your skills. Your pace. Your future.',
  ],
  badge = '✦ Modern Developer LMS',
  subtitle = 'Master in-demand engineering skills with hands-on courses, structured lessons, and interactive projects.',
  className = '',
}) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  // Hydration-safe mounting check
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  // Respect system reduced-motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (prefersReducedMotion || !isHydrated) return

    const currentPhrase = phrases[phraseIndex % phrases.length]
    let timeoutId

    if (!isDeleting) {
      // 1. Typing forward
      if (charIndex < currentPhrase.length) {
        // Natural typing speed variation: ~45-75ms per character
        const typingDelay = 55 + Math.random() * 25
        timeoutId = setTimeout(() => {
          setCharIndex((prev) => prev + 1)
        }, typingDelay)
      } else {
        // 2. Pause when the full phrase is displayed (2.2 seconds)
        timeoutId = setTimeout(() => {
          setIsDeleting(true)
        }, 2200)
      }
    } else {
      // 3. Backspacing / deleting
      if (charIndex > 0) {
        // Deleting speed: crisp 28ms per character
        timeoutId = setTimeout(() => {
          setCharIndex((prev) => prev - 1)
        }, 28)
      } else {
        // 4. Brief pause before starting to type the next phrase
        timeoutId = setTimeout(() => {
          setIsDeleting(false)
          setPhraseIndex((prev) => (prev + 1) % phrases.length)
        }, 400)
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [charIndex, isDeleting, phraseIndex, phrases, prefersReducedMotion, isHydrated])

  const activePhrase = phrases[phraseIndex % phrases.length]
  const displayedText = prefersReducedMotion
    ? activePhrase
    : activePhrase.slice(0, charIndex)

  return (
    <div className={`flex flex-col items-center text-center lg:items-start lg:text-left ${className}`}>
      {/* Pill Badge */}
      {badge && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-blue-300 shadow-sm backdrop-blur-md">
          <span>{badge}</span>
        </div>
      )}

      {/* Screen reader only announcement (announces complete phrase, not keystrokes) */}
      <span className="sr-only" aria-live="polite">
        {activePhrase}
      </span>

      {/* Visual Typewriter Headline */}
      <h2
        aria-hidden="true"
        className="min-h-[2.5em] text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl leading-[1.15]"
      >
        <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
          {displayedText}
        </span>
        {/* Blinking Cursor */}
        {!prefersReducedMotion && (
          <span
            className="ml-1 inline-block h-[0.85em] w-[3px] translate-y-[2px] bg-blue-400 align-middle shadow-[0_0_8px_#60a5fa] animate-pulse"
          />
        )}
      </h2>

      {/* Subtitle */}
      {subtitle && (
        <p className="mt-4 max-w-lg text-sm text-white/60 sm:text-base leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}