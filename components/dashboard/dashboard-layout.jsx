import Link from 'next/link'
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  Medal,
  Settings,
  Target,
  Users,
} from 'lucide-react'

export const dashboardSections = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, key: 'overview' },
  { label: 'My Courses', href: '/dashboard/my-courses', icon: BookOpen, key: 'my-courses' },
  { label: 'Learning Path', href: '/dashboard/learning-path', icon: Target, key: 'learning-path' },
  { label: 'Live Classes', href: '/dashboard/live-classes', icon: CalendarDays, key: 'live-classes' },
  { label: 'Remote Labs', href: '/dashboard/remote-labs', icon: FlaskConical, key: 'remote-labs' },
  { label: 'Simulator', href: '/dashboard/simulator', icon: Activity, key: 'simulator' },
  { label: 'Assignments', href: '/dashboard/assignments', icon: GraduationCap, key: 'assignments' },
  { label: 'Grades', href: '/dashboard/grades', icon: Medal, key: 'grades' },
  { label: 'Certificates', href: '/dashboard/certificates', icon: Award, key: 'certificates' },
  { label: 'Community', href: '/dashboard/community', icon: Users, key: 'community' },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell, key: 'notifications' },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, key: 'settings' },
]

function SectionLink({ section, active }) {
  const Icon = section.icon

  return (
    <Link
      href={section.href}
      aria-current={active ? 'page' : undefined}
      className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <Icon className="size-4 shrink-0" />
      <span>{section.label}</span>
    </Link>
  )
}

export function DashboardLayout({ activeSection, children }) {
  return (
    <div className="mx-auto grid w-full max-w-[1500px] gap-6 px-4 pb-28 pt-6 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:px-8 lg:pb-10 lg:pt-8">
      <aside className="hidden lg:block">
        <div className="sticky top-28 rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
          <div className="mb-3 px-3 pb-3 pt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Learner space</p>
            <p className="mt-1 text-sm text-muted-foreground">Your robotics journey</p>
          </div>
          <nav aria-label="Student dashboard" className="flex flex-col gap-1">
            {dashboardSections.map((section) => (
              <SectionLink
                key={section.key}
                section={section}
                active={activeSection === section.key}
              />
            ))}
          </nav>
        </div>
      </aside>

      <main className="min-w-0">{children}</main>

      <nav
        aria-label="Student dashboard"
        className="fixed inset-x-3 bottom-3 z-40 flex gap-1 overflow-x-auto rounded-2xl border border-border/80 bg-card/95 p-2 shadow-xl backdrop-blur-lg lg:hidden"
      >
        {dashboardSections.map((section) => {
          const Icon = section.icon
          const active = activeSection === section.key

          return (
            <Link
              key={section.key}
              href={section.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-[66px] shrink-0 snap-start flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium ${
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              <Icon className="size-4" />
              <span>{section.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
