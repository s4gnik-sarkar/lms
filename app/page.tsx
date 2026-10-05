import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Clock, GraduationCap, TrendingUp, ArrowRight, CheckCircle, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'LMS Platform - Learn & Teach Online',
  description: 'Master new skills with expert-led courses. Track your progress and learn at your own pace.',
}

/**
 * Public Landing / Home Page.
 *
 * Sections:
 * 1. Hero: Headline, subtitle, "Get started" button to /signup, "Browse courses" button to /courses.
 * 2. Features: 3 cards (Learn at your pace, Expert instructors, Track your progress).
 * 3. How It Works: 3 simple sequential steps.
 * 4. Call-to-Action (CTA) Banner: High-impact banner leading to /signup.
 */
export default function HomePage() {
  const features = [
    {
      icon: Clock,
      title: 'Learn at your pace',
      description:
        'Flexible, self-paced lessons that easily adapt to your daily schedule. Pause, review, and resume anytime you want.',
    },
    {
      icon: GraduationCap,
      title: 'Expert instructors',
      description:
        'Courses created by passionate industry practitioners focused on real-world skills and practical knowledge.',
    },
    {
      icon: TrendingUp,
      title: 'Track your progress',
      description:
        'Stay motivated with transparent lesson-by-lesson tracking, course completion indicators, and clear milestones.',
    },
  ]

  const steps = [
    {
      step: '01',
      title: 'Create an Account',
      description:
        'Register in seconds as a student to explore lessons, or as an instructor to build and publish courses.',
    },
    {
      step: '02',
      title: 'Enroll in Courses',
      description:
        'Browse through our catalog of topics, choose the course you want to explore, and enroll with a single click.',
    },
    {
      step: '03',
      title: 'Learn & Master Skills',
      description:
        'Follow structured lessons, complete course materials, and track your progress all the way to completion.',
    },
  ]

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* ============================================================== */}
      {/* 1. Hero Section                                                */}
      {/* ============================================================== */}
      <section className="relative overflow-hidden pt-16 md:pt-24 lg:pt-32 text-center">
        <div className="container mx-auto max-w-5xl px-4 flex flex-col items-center">
          {/* Subtle announcement pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-4 py-1.5 text-xs font-medium text-foreground mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Welcome to the next generation of online learning</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl max-w-3xl text-foreground">
            Master New Skills,{' '}
            <span className="text-primary underline decoration-primary/40 underline-offset-8">
              Advance Your Future
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Discover expert-led courses designed for real-world impact. Learn at your own pace, track your progress step-by-step, and achieve your educational goals.
          </p>

          {/* Call-to-action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto gap-2" asChild>
              <Link href="/signup">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. 3-Card Features Section                                     */}
      {/* ============================================================== */}
      <section className="container mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Everything You Need to Succeed
          </h2>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">
            Built from the ground up to offer an engaging, clutter-free learning experience.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="relative overflow-hidden border transition-all hover:shadow-md">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. How It Works (3 Steps)                                      */}
      {/* ============================================================== */}
      <section className="container mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border bg-muted/30 p-8 sm:p-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              How It Works
            </h2>
            <p className="mt-2 text-muted-foreground text-sm sm:text-base">
              Start expanding your skillset in three straightforward steps.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-sm mb-4 shadow">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. Call-to-Action (CTA) Banner                                 */}
      {/* ============================================================== */}
      <section className="container mx-auto max-w-5xl px-4">
        <div className="rounded-2xl bg-primary text-primary-foreground p-8 sm:p-12 shadow-lg text-center flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="mt-4 max-w-xl text-primary-foreground/90 text-sm sm:text-base leading-relaxed">
            Join our community of motivated students and expert instructors today. Sign up in less than a minute and start learning.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button size="lg" variant="secondary" className="gap-2 font-semibold shadow-sm" asChild>
              <Link href="/signup">
                Get started today
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-6 flex items-center gap-4 text-xs text-primary-foreground/80">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> Free registration
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> Instant course access
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> Learn at your own pace
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}