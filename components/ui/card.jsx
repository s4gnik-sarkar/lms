import * as React from 'react'
import { cn } from '@/lib/utils'

// JSDoc @param types below make these forwardRef components consumable from
// TypeScript files (.tsx) — without them TS can only infer empty props.
const Card = React.forwardRef(
  /** @param {{ className?: string } & React.HTMLAttributes<HTMLDivElement>} props */
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef(
  /** @param {{ className?: string } & React.HTMLAttributes<HTMLDivElement>} props */
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef(
  /** @param {{ className?: string } & React.HTMLAttributes<HTMLHeadingElement>} props */
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight text-lg', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef(
  /** @param {{ className?: string } & React.HTMLAttributes<HTMLParagraphElement>} props */
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef(
  /** @param {{ className?: string } & React.HTMLAttributes<HTMLDivElement>} props */
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef(
  /** @param {{ className?: string } & React.HTMLAttributes<HTMLDivElement>} props */
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

