'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Reusable confirmation button client component.
 * Prompts the user with a confirmation step (e.g., "Are you sure?")
 * before executing a Server Action.
 */
export function ConfirmButton({
  action,
  confirmMessage = 'Are you sure you want to proceed?',
  buttonText = 'Delete',
  variant = 'destructive',
  size = 'sm',
  className = '',
}) {
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Prompt the user for confirmation in the browser
    const confirmed = window.confirm(confirmMessage)
    if (!confirmed) return

    setIsPending(true)
    try {
      await action()
    } catch (err) {
      console.error('Action error:', err)
      alert(err.message || 'An error occurred while processing your request.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'inline-block' }}>
      <Button
        type="submit"
        variant={variant}
        size={size}
        disabled={isPending}
        className={className}
      >
        {isPending ? 'Processing...' : buttonText}
      </Button>
    </form>
  )
}