import Link from 'next/link'

/**
 * Minimal Robotics Platform Navbar
 *
 * Displays platform branding in Orbitron and navigation links in Rajdhani.
 * Uses a semi-transparent cybernetic glass backdrop.
 */
export function Navbar() {
  const navLinks = [
    { label: 'Courses', href: '#courses' },
    { label: 'Labs', href: '#labs' },
    { label: 'About', href: '#about' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#00E5FF]/10 bg-[#040711]/75 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* Platform Logo */}
        <Link
          href="/"
          className="flex items-center gap-1.5 sm:gap-2 group transition-opacity hover:opacity-90 shrink-0"
        >
          {/* Cybernetic Accent Glyph */}
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#00E5FF] rounded-xs shadow-[0_0_8px_#00E5FF] group-hover:scale-110 transition-transform" />
          <span className="font-display font-extrabold tracking-wider sm:tracking-widest text-xs sm:text-base md:text-lg text-white uppercase neon-glow-subtle">
            Automata <span className="text-[#00E5FF] hidden sm:inline">Academy</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav aria-label="Main Navigation">
          <ul className="flex items-center gap-2.5 sm:gap-8">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="font-body font-semibold tracking-wider text-xs sm:text-base text-slate-300 hover:text-[#00E5FF] transition-colors relative py-1 group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#00E5FF] shadow-[0_0_6px_#00E5FF] transition-all duration-200 group-hover:w-full" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}

