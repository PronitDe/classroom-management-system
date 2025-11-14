-- Security Hardening: Enhanced RLS Policies
-- This migration locks down role changes and enforces least-privilege access

-- 1. Create a security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.user_has_role(user_id uuid, check_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
      AND role = check_role
  );
$$;

-- 2. Create a security definer function to check if user is privileged (SPOC or ADMIN)
CREATE OR REPLACE FUNCTION public.user_is_privileged(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
      AND role IN ('SPOC', 'ADMIN')
  );
$$;

-- 3. Update profiles RLS policies to prevent role escalation
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Allow users to update their own profile BUT NOT the role field
CREATE POLICY "Users can update their own profile name only"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (
    -- Check that role is not being changed (either not in update, or unchanged)
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = role
  )
);

-- Allow admins to update any profile including roles
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.user_has_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.user_has_role(auth.uid(), 'ADMIN'));

-- 4. Enhance rooms RLS policies
-- Already has good policies, just add clarity comment
COMMENT ON POLICY "Anyone can view active rooms" ON public.rooms IS 
'Users can view active rooms; SPOC/ADMIN can view all rooms';

COMMENT ON POLICY "SPOC and Admin can manage rooms" ON public.rooms IS 
'Only SPOC and ADMIN roles can create, update, or delete rooms';

-- 5. Enhance bookings RLS policies
COMMENT ON POLICY "Teachers can create bookings" ON public.bookings IS 
'Teachers can only create bookings for themselves';

COMMENT ON POLICY "Teachers can view their own bookings" ON public.bookings IS 
'Teachers see only their bookings; SPOC/ADMIN see all bookings';

COMMENT ON POLICY "SPOC and Admin can update bookings" ON public.bookings IS 
'Only SPOC/ADMIN can approve, reject, or update booking status';

-- 6. Enhance attendance RLS policies  
COMMENT ON POLICY "Teachers can create attendance for their bookings" ON public.attendance IS 
'Teachers can only mark attendance for their own approved bookings';

COMMENT ON POLICY "Teachers can view their own attendance" ON public.attendance IS 
'Teachers see only their attendance records; SPOC/ADMIN see all';

-- 7. Enhance issue_reports RLS policies
COMMENT ON POLICY "Teachers can create issues" ON public.issue_reports IS 
'Teachers can only create issues for themselves';

COMMENT ON POLICY "Teachers can view their own issues" ON public.issue_reports IS 
'Teachers see only their issues; SPOC/ADMIN see all issues';

COMMENT ON POLICY "SPOC and Admin can update issues" ON public.issue_reports IS 
'Only SPOC/ADMIN can update issue status and add responses';

-- 8. Add indexes for performance on role checks
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_bookings_teacher_date ON public.bookings(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_issue_reports_status ON public.issue_reports(status);

-- Security audit log
COMMENT ON FUNCTION public.user_has_role IS 
'Security definer function to safely check user role without RLS recursion';

COMMENT ON FUNCTION public.user_is_privileged IS 
'Security definer function to check if user is SPOC or ADMIN';