import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * ShineButton — primary action button with a light sweep that travels across
 * it (magicui / 21st.dev "Shiny Button" style). The sweep is pure CSS
 * (`.btn-shine` in app/globals.css), so no extra dependency is needed.
 *
 * Wraps the shared shadcn Button, so it accepts all Button props
 * (`type`, `disabled`, `variant`, `size`, `onClick`, ...).
 *
 * Usage: <ShineButton type="submit" disabled={loading}>Log In</ShineButton>
 */
export function ShineButton({ className, ...props }) {
  return (
    <Button
      className={cn('btn-shine h-11 w-full rounded-lg text-sm font-semibold', className)}
      {...props}
    />
  )
}
