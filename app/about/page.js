import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Target, Users, BookOpen, Award } from 'lucide-react'

export const metadata = {
  title: 'About Us - LMS Platform',
  description: 'Learn about our mission to make quality online education accessible to all.',
}

/**
 * Public About Us page.
 * Includes our mission statement, core platform values, and 3 team members.
 */
export default function AboutPage() {
  const teamMembers = [
    {
      name: 'Alex Rivera',
      role: 'Founder & Head of Curriculum',
      initials: 'AR',
      bio: 'Former university lecturer and full-stack engineer passionate about democratizing computer science education.',
    },
    {
      name: 'Elena Rostova',
      role: 'Lead Platform Architect',
      initials: 'ER',
      bio: 'Cloud architecture specialist dedicated to building ultra-fast, accessible learning management tools.',
    },
    {
      name: 'David Kim',
      role: 'Student Success Director',
      initials: 'DK',
      bio: 'Experienced educator focused on mentorship, peer engagement, and interactive project-based learning.',
    },
  ]

  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description:
        'To empower learners and educators worldwide by providing a flexible, modern platform for sharing and acquiring real-world skills.',
    },
    {
      icon: BookOpen,
      title: 'Accessible Learning',
      description:
        'Education should be self-paced and free from artificial barriers. Learn whenever you want, wherever you are.',
    },
    {
      icon: Award,
      title: 'Quality First',
      description:
        'Every course is structured for clarity, actionable knowledge, and measurable progress tracking.',
    },
  ]

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
      {/* ============================================================== */}
      {/* Hero & Mission Section                                         */}
      {/* ============================================================== */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
          About LMS Platform
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          We are committed to modernizing online learning. Whether you are an aspiring developer, a creative professional, or an instructor looking to share your craft, our platform gives you the tools to succeed.
        </p>
      </div>

      {/* Core Values Grid */}
      <div className="grid gap-6 sm:grid-cols-3 mb-20">
        {values.map((val) => {
          const Icon = val.icon
          return (
            <Card key={val.title} className="text-center border-muted">
              <CardHeader className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{val.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {val.description}
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ============================================================== */}
      {/* Team Section (3 Placeholder Members)                           */}
      {/* ============================================================== */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="flex items-center justify-center gap-2 text-primary font-semibold text-sm mb-2">
          <Users className="h-4 w-4" />
          <span>Our Team</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
          Meet the Minds Behind the Platform
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A dedicated group of educators, developers, and designers working together to build a better learning experience.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {teamMembers.map((member) => (
          <Card key={member.name} className="flex flex-col text-center">
            <CardHeader className="flex flex-col items-center pb-2">
              <div className="h-16 w-16 rounded-full bg-secondary text-secondary-foreground font-bold text-lg flex items-center justify-center mb-3 border shadow-sm">
                {member.initials}
              </div>
              <CardTitle className="text-base">{member.name}</CardTitle>
              <p className="text-xs font-medium text-primary mt-1">{member.role}</p>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {member.bio}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}