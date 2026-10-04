import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines conditional class names (via clsx) and resolves conflicting
 * Tailwind CSS utilities (via tailwind-merge).
 * 
 * Example: cn('px-2 py-1', isPrimary && 'bg-blue-600', 'px-4')
 * Result: 'py-1 bg-blue-600 px-4' (px-4 overrides px-2 without collision)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

