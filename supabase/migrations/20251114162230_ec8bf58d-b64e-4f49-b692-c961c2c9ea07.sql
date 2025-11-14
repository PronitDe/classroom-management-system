-- Create enum types
CREATE TYPE user_role AS ENUM ('TEACHER', 'SPOC', 'ADMIN', 'STUDENT');
CREATE TYPE room_type AS ENUM ('LECTURE_HALL', 'LAB', 'SEMINAR_ROOM', 'FACULTY_ROOM');
CREATE TYPE booking_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE issue_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building TEXT NOT NULL,
  room_no TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  type room_type NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(building, room_no)
);

-- Enable RLS on rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Rooms policies
CREATE POLICY "Anyone can view active rooms"
  ON public.rooms FOR SELECT
  USING (is_active = true OR auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('SPOC', 'ADMIN')
  ));

CREATE POLICY "SPOC and Admin can manage rooms"
  ON public.rooms FOR ALL
  USING (auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('SPOC', 'ADMIN')
  ));

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  slot TEXT NOT NULL,
  status booking_status NOT NULL DEFAULT 'PENDING',
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Bookings policies
CREATE POLICY "Teachers can view their own bookings"
  ON public.bookings FOR SELECT
  USING (
    teacher_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('SPOC', 'ADMIN'))
  );

CREATE POLICY "Teachers can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'TEACHER')
  );

CREATE POLICY "SPOC and Admin can update bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('SPOC', 'ADMIN')
  ));

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  slot TEXT NOT NULL,
  total INTEGER NOT NULL CHECK (total > 0),
  present INTEGER NOT NULL CHECK (present >= 0 AND present <= total),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Attendance policies
CREATE POLICY "Teachers can view their own attendance"
  ON public.attendance FOR SELECT
  USING (
    teacher_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('SPOC', 'ADMIN'))
  );

CREATE POLICY "Teachers can create attendance for their bookings"
  ON public.attendance FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND teacher_id = auth.uid() AND status = 'APPROVED')
  );

-- Create issue_reports table
CREATE TABLE public.issue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status issue_status NOT NULL DEFAULT 'OPEN',
  response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on issue_reports
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;

-- Issue reports policies
CREATE POLICY "Teachers can view their own issues"
  ON public.issue_reports FOR SELECT
  USING (
    teacher_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('SPOC', 'ADMIN'))
  );

CREATE POLICY "Teachers can create issues"
  ON public.issue_reports FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'TEACHER')
  );

CREATE POLICY "SPOC and Admin can update issues"
  ON public.issue_reports FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('SPOC', 'ADMIN')
  ));

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'STUDENT')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_issue_reports_updated_at
  BEFORE UPDATE ON public.issue_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert seed data for rooms (AU4-AU7)
INSERT INTO public.rooms (building, room_no, capacity, type, is_active) VALUES
  -- AU4 Building
  ('AU4', '101', 60, 'LECTURE_HALL', true),
  ('AU4', '102', 60, 'LECTURE_HALL', true),
  ('AU4', '103', 50, 'LECTURE_HALL', true),
  ('AU4', '201', 40, 'LAB', true),
  ('AU4', '202', 40, 'LAB', true),
  ('AU4', '301', 30, 'SEMINAR_ROOM', true),
  
  -- AU5 Building
  ('AU5', '101', 80, 'LECTURE_HALL', true),
  ('AU5', '102', 70, 'LECTURE_HALL', true),
  ('AU5', '103', 60, 'LECTURE_HALL', true),
  ('AU5', '201', 50, 'LAB', true),
  ('AU5', '202', 50, 'LAB', true),
  ('AU5', '301', 35, 'SEMINAR_ROOM', true),
  
  -- AU6 Building
  ('AU6', '101', 100, 'LECTURE_HALL', true),
  ('AU6', '102', 80, 'LECTURE_HALL', true),
  ('AU6', '103', 60, 'LECTURE_HALL', true),
  ('AU6', '201', 45, 'LAB', true),
  ('AU6', '202', 45, 'LAB', true),
  ('AU6', '301', 40, 'SEMINAR_ROOM', true),
  ('AU6', '302', 30, 'SEMINAR_ROOM', true),
  
  -- AU7 Building
  ('AU7', '101', 120, 'LECTURE_HALL', true),
  ('AU7', '102', 90, 'LECTURE_HALL', true),
  ('AU7', '103', 70, 'LECTURE_HALL', true),
  ('AU7', '201', 60, 'LAB', true),
  ('AU7', '202', 50, 'LAB', true),
  ('AU7', '301', 25, 'FACULTY_ROOM', true)
ON CONFLICT (building, room_no) DO NOTHING;