-- ============================================
-- CRITICAL SECURITY FIX: Migrate to user_roles table
-- ============================================

-- Step 1: Drop ALL existing RLS policies first (they depend on old functions)

-- Profiles policies
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile name only" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Rooms policies
DROP POLICY IF EXISTS "Anyone can view active rooms" ON public.rooms;
DROP POLICY IF EXISTS "SPOC and Admin can manage rooms" ON public.rooms;

-- Bookings policies
DROP POLICY IF EXISTS "Teachers can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Teachers can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "SPOC and Admin can update bookings" ON public.bookings;

-- Attendance policies
DROP POLICY IF EXISTS "Teachers can create attendance for their bookings" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can view their own attendance" ON public.attendance;

-- Issue reports policies
DROP POLICY IF EXISTS "Teachers can create issues" ON public.issue_reports;
DROP POLICY IF EXISTS "Teachers can view their own issues" ON public.issue_reports;
DROP POLICY IF EXISTS "SPOC and Admin can update issues" ON public.issue_reports;

-- Notices policies
DROP POLICY IF EXISTS "Admins can insert notices" ON public.notices;
DROP POLICY IF EXISTS "Admins can update notices" ON public.notices;
DROP POLICY IF EXISTS "Admins can delete notices" ON public.notices;
DROP POLICY IF EXISTS "Anyone can view notices" ON public.notices;

-- Student feedback policies
DROP POLICY IF EXISTS "Students can insert their own feedback" ON public.student_feedback;
DROP POLICY IF EXISTS "Students can view their own feedback" ON public.student_feedback;
DROP POLICY IF EXISTS "SPOC and Admin can update feedback" ON public.student_feedback;

-- Step 2: Now drop old functions
DROP FUNCTION IF EXISTS public.user_is_privileged(uuid);
DROP FUNCTION IF EXISTS public.user_has_role(uuid, user_role);

-- Step 3: Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Step 4: Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 5: Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 6: Create new has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Step 7: Create new user_is_privileged function using user_roles
CREATE OR REPLACE FUNCTION public.user_is_privileged(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('SPOC', 'ADMIN')
  );
$$;

-- Step 8: Recreate ALL policies using new has_role function

-- ========== PROFILES POLICIES ==========
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Users can update their own profile name only"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.has_role(auth.uid(), 'ADMIN'));

-- ========== ROOMS POLICIES ==========
CREATE POLICY "Authenticated users can view active rooms"
ON public.rooms FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (is_active = true OR public.user_is_privileged(auth.uid()))
);

CREATE POLICY "SPOC and Admin can manage rooms"
ON public.rooms FOR ALL
USING (public.user_is_privileged(auth.uid()));

-- ========== BOOKINGS POLICIES ==========
CREATE POLICY "Teachers can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (
  teacher_id = auth.uid()
  AND public.has_role(auth.uid(), 'TEACHER')
);

CREATE POLICY "Teachers can view their own bookings"
ON public.bookings FOR SELECT
USING (
  teacher_id = auth.uid()
  OR public.user_is_privileged(auth.uid())
);

CREATE POLICY "SPOC and Admin can update bookings"
ON public.bookings FOR UPDATE
USING (public.user_is_privileged(auth.uid()));

-- ========== ATTENDANCE POLICIES ==========
CREATE POLICY "Teachers can create attendance for their bookings"
ON public.attendance FOR INSERT
WITH CHECK (
  teacher_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id
      AND b.teacher_id = auth.uid()
      AND b.status = 'APPROVED'
  )
);

CREATE POLICY "Teachers can view their own attendance"
ON public.attendance FOR SELECT
USING (
  teacher_id = auth.uid()
  OR public.user_is_privileged(auth.uid())
);

-- ========== ISSUE REPORTS POLICIES ==========
CREATE POLICY "Teachers can create issues"
ON public.issue_reports FOR INSERT
WITH CHECK (
  teacher_id = auth.uid()
  AND public.has_role(auth.uid(), 'TEACHER')
);

CREATE POLICY "Teachers can view their own issues"
ON public.issue_reports FOR SELECT
USING (
  teacher_id = auth.uid()
  OR public.user_is_privileged(auth.uid())
);

CREATE POLICY "SPOC and Admin can update issues"
ON public.issue_reports FOR UPDATE
USING (public.user_is_privileged(auth.uid()));

-- ========== NOTICES POLICIES ==========
CREATE POLICY "Admins can insert notices"
ON public.notices FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can update notices"
ON public.notices FOR UPDATE
USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can delete notices"
ON public.notices FOR DELETE
USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Authenticated users can view notices"
ON public.notices FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ========== STUDENT FEEDBACK POLICIES ==========
CREATE POLICY "Students can insert their own feedback"
ON public.student_feedback FOR INSERT
WITH CHECK (
  student_id = auth.uid()
  AND public.has_role(auth.uid(), 'STUDENT')
);

CREATE POLICY "Students can view their own feedback"
ON public.student_feedback FOR SELECT
USING (
  student_id = auth.uid()
  OR public.user_is_privileged(auth.uid())
);

CREATE POLICY "SPOC and Admin can update feedback"
ON public.student_feedback FOR UPDATE
USING (public.user_is_privileged(auth.uid()));

-- ========== USER ROLES POLICIES ==========
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'ADMIN'));

-- Step 9: Update handle_new_user trigger to use user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles (without role column)
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  
  -- Insert default STUDENT role into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'STUDENT');
  
  RETURN NEW;
END;
$$;

-- Step 10: Drop role column from profiles (CRITICAL SECURITY FIX)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Step 11: Add database constraints for data integrity
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS unique_room_date_slot;
ALTER TABLE public.bookings ADD CONSTRAINT unique_room_date_slot UNIQUE (room_id, date, slot);

-- Step 12: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_bookings_teacher_id ON public.bookings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON public.bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_id ON public.attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_booking_id ON public.attendance(booking_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_issue_reports_teacher_id ON public.issue_reports(teacher_id);
CREATE INDEX IF NOT EXISTS idx_issue_reports_status ON public.issue_reports(status);
CREATE INDEX IF NOT EXISTS idx_issue_reports_room_id ON public.issue_reports(room_id);
CREATE INDEX IF NOT EXISTS idx_student_feedback_student_id ON public.student_feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_student_feedback_status ON public.student_feedback(status);
CREATE INDEX IF NOT EXISTS idx_rooms_building ON public.rooms(building);
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON public.rooms(is_active);

-- Step 13: Add CHECK constraints for data validation
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS check_booking_date_future;
ALTER TABLE public.bookings ADD CONSTRAINT check_booking_date_future CHECK (date >= CURRENT_DATE);

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS check_attendance_valid_counts;
ALTER TABLE public.attendance ADD CONSTRAINT check_attendance_valid_counts CHECK (present >= 0 AND present <= total AND total > 0);

ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS check_room_capacity_positive;
ALTER TABLE public.rooms ADD CONSTRAINT check_room_capacity_positive CHECK (capacity > 0);