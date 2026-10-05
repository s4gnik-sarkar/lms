import { ContactForm } from '@/components/contact-form'

export const metadata = {
  title: 'Contact Us - LMS Platform',
  description: 'Get in touch with the LMS Platform team for questions, support, or inquiries.',
}

/**
 * Public Contact Us page.
 * Displays heading, contact context, and mounts the interactive ContactForm component.
 */
export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
      <div className="text-center max-w-xl mx-auto mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
          Contact Us
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Have a question about a course, need technical assistance, or want to partner with us? We&apos;d love to hear from you.
        </p>
      </div>

      {/* Interactive Contact Form */}
      <ContactForm />
    </div>
  )
}