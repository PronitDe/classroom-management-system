-- Update handle_new_user trigger to support secure role selection
-- Only STUDENT and TEACHER roles can be selected at signup
-- Any other value (including SPOC/ADMIN) will default to STUDENT

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text;
  final_role user_role;
BEGIN
  -- Insert into profiles (without role column)
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  
  -- Read requested_role from user metadata
  requested_role := NEW.raw_user_meta_data->>'requested_role';
  
  -- Sanitize: only allow STUDENT or TEACHER, else default to STUDENT
  -- This prevents privilege escalation - SPOC and ADMIN can never be selected at signup
  IF requested_role = 'TEACHER' THEN
    final_role := 'TEACHER'::user_role;
  ELSE
    -- Default to STUDENT for any other value (including NULL, 'ADMIN', 'SPOC', etc.)
    final_role := 'STUDENT'::user_role;
  END IF;
  
  -- Insert the sanitized role into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, final_role);
  
  RETURN NEW;
END;
$$;