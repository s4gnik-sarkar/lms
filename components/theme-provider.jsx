'use client'

import * as React from 'react'

const ThemeContext = React.createContext(null)
const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)'

function getSystemTheme() {
  return window.matchMedia(COLOR_SCHEME_QUERY).matches ? 'dark' : 'light'
}

function applyTheme(theme, attribute, enableSystem, enableColorScheme, disableTransitionOnChange) {
  const resolvedTheme = theme === 'system' && enableSystem ? getSystemTheme() : theme
  const root = document.documentElement
  let transitionStyle

  if (disableTransitionOnChange) {
    transitionStyle = document.createElement('style')
    transitionStyle.textContent =
      '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}'
    document.head.appendChild(transitionStyle)
  }

  if (attribute === 'class') {
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
  } else if (attribute.startsWith('data-')) {
    root.setAttribute(attribute, resolvedTheme)
  }

  if (enableColorScheme) {
    root.style.colorScheme = resolvedTheme
  }

  if (transitionStyle) {
    window.getComputedStyle(document.body)
    window.setTimeout(() => transitionStyle.remove(), 1)
  }

  return resolvedTheme
}

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
  enableColorScheme = true,
  disableTransitionOnChange = false,
  storageKey = 'theme',
}) {
  const [theme, setThemeState] = React.useState(() => {
    if (typeof window === 'undefined') {
      return defaultTheme
    }

    try {
      return window.localStorage.getItem(storageKey) || defaultTheme
    } catch {
      return defaultTheme
    }
  })
  const [systemTheme, setSystemTheme] = React.useState(() =>
    typeof window === 'undefined' ? 'light' : getSystemTheme()
  )
  const resolvedTheme = theme === 'system' && enableSystem ? systemTheme : theme

  const setTheme = React.useCallback(
    (nextTheme) => {
      setThemeState(nextTheme)
      if (nextTheme === 'system') {
        setSystemTheme(getSystemTheme())
      }
      try {
        window.localStorage.setItem(storageKey, nextTheme)
      } catch {
        // Theme preferences are still applied when storage is unavailable.
      }
    },
    [storageKey]
  )

  React.useEffect(() => {
    applyTheme(theme, attribute, enableSystem, enableColorScheme, disableTransitionOnChange)
  }, [attribute, disableTransitionOnChange, enableColorScheme, enableSystem, theme])

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY)
    const handleSystemThemeChange = () => {
      if (theme === 'system' && enableSystem) {
        setSystemTheme(getSystemTheme())
        applyTheme('system', attribute, enableSystem, enableColorScheme, disableTransitionOnChange)
      }
    }
    const handleStorageChange = (event) => {
      if (event.key === storageKey) {
        const nextTheme = event.newValue || defaultTheme
        setThemeState(nextTheme)
        if (nextTheme === 'system') {
          setSystemTheme(getSystemTheme())
        }
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    window.addEventListener('storage', handleStorageChange)
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [attribute, defaultTheme, disableTransitionOnChange, enableColorScheme, enableSystem, storageKey, theme])

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      themes: enableSystem ? ['light', 'dark', 'system'] : ['light', 'dark'],
      systemTheme: enableSystem ? systemTheme : undefined,
    }),
    [enableSystem, resolvedTheme, setTheme, systemTheme, theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider.')
  }
  return context
}
