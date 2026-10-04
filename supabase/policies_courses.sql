-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR COURSES TABLE
-- File: supabase/policies_courses.sql
-- ==============================================================================

-- 1. Ensure Row Level Security is enabled on the courses table
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 2. SELECT Policy: Any logged-in (authenticated) user can view courses
-- This allows students to browse courses and instructors to see courses.
DROP POLICY IF EXISTS "Any logged-in user can read courses" ON public.courses;
CREATE POLICY "Any logged-in user can read courses"
ON public.courses
FOR SELECT
TO authenticated
USING (true);

-- 3. INSERT Policy: Only users with the role 'instructor' can create courses,
-- and they must set themselves as the instructor (instructor_id = auth.uid()).
DROP POLICY IF EXISTS "Instructors can insert their own courses" ON public.courses;
CREATE POLICY "Instructors can insert their own courses"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = instructor_id AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'instructor'
    )
);

-- 4. UPDATE Policy: Instructors can only edit their own courses
DROP POLICY IF EXISTS "Instructors can update their own courses" ON public.courses;
CREATE POLICY "Instructors can update their own courses"
ON public.courses
FOR UPDATE
TO authenticated
USING (auth.uid() = instructor_id)
WITH CHECK (auth.uid() = instructor_id);

-- 5. DELETE Policy: Instructors can only delete their own courses
DROP POLICY IF EXISTS "Instructors can delete their own courses" ON public.courses;
CREATE POLICY "Instructors can delete their own courses"
ON public.courses
FOR DELETE
TO authenticated
USING (auth.uid() = instructor_id);