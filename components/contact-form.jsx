'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { CheckCircle2, Send } from 'lucide-react'

/**
 * Interactive Client Component for the Contact form.
 *
 * Uses React state (`useState`) to handle client-side form submission
 * and display a confirmation message without reloading the page.
 */
export function ContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Simulated submission - updates client state to show success screen
    setSubmitted(true)
  }

  const handleReset = () => {
    setFormData({ name: '', email: '', message: '' })
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <Card className="max-w-lg mx-auto border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="pt-6 pb-6 text-center flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              Thanks, we&apos;ll get back to you!
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              We received your message, <strong>{formData.name}</strong>. A member of our support team will reply to <em>{formData.email}</em> shortly.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="mt-2">
            Send another message
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Send Us a Message</CardTitle>
        <CardDescription>
          Fill out the form below and we will respond to your inquiry as soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Jane Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jane@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              rows={4}
              placeholder="How can we help you?"
              value={formData.message}
              onChange={handleChange}
              required
            />
          </div>

          <Button type="submit" className="w-full mt-2 gap-2">
            <Send className="h-4 w-4" />
            Send Message
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}