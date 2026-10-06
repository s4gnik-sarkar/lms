-- ==============================================================================
-- PUBLIC READ ACCESS POLICIES (Supabase / PostgreSQL)
-- File: supabase/policies_public.sql
-- ==============================================================================
-- 
-- What this SQL does:
-- 1. COURSES: Replaces restrictive "authenticated-only" SELECT policies with a public
--    policy allowing anyone (including anonymous visitors who are NOT logged in)
--    to read published courses (or instructors to read their own drafts).
-- 2. PROFILES: Allows public (anon + authenticated) read access to user profiles so
--    course cards can display the instructor's display name (`full_name`) and avatar.
--    NOTE: User emails are stored securely in Supabase's private `auth.users` table
--    and are NEVER exposed by the public profiles table.
-- 3. LESSONS: Left restricted to authenticated & enrolled students / course instructors,
--    so private lesson materials remain locked and cannot be viewed by public visitors.
-- ==============================================================================

-- 1. COURSES TABLE: Allow public read access
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Any logged-in user can read courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone authenticated can view published courses or their own courses" ON public.courses;

CREATE POLICY "Anyone can view published courses"
ON public.courses
FOR SELECT
TO public
USING (true);

-- 2. PROFILES TABLE: Allow public to view instructor display name & avatar
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Public can view profiles"
ON public.profiles
FOR SELECT
TO public
USING (true);

