# Project: Robotics LMS
Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase (Auth, Postgres, RLS).
Roles: student, instructor (stored in profiles.role).

Rules:
- Every new table must have Row Level Security enabled, with policies written in a SQL file under supabase/.
- Use Server Actions for mutations and verify the user and ownership on the server, never trust the UI.
- In Next.js 15+, `params` and `searchParams` are Promises: await them.
- Reuse existing components (CourseCard, navbar, shadcn/ui). Match the current dark/light theme.
- Fully typed TypeScript, no `any`. Handle loading, empty and error states on every page.
- Responsive and accessible. Do not touch existing auth, navbar and courses logic unless a task requires it.
- Explain your plan before coding, and after the code, explain simply and list new terms to learn.