-- Drop the old foreign key constraint that references auth.users
ALTER TABLE public.student_feedback 
DROP CONSTRAINT IF EXISTS student_feedback_student_id_fkey;

-- Add new foreign key constraint that references profiles
ALTER TABLE public.student_feedback
ADD CONSTRAINT student_feedback_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Also update the responded_by foreign key to reference profiles
ALTER TABLE public.student_feedback
DROP CONSTRAINT IF EXISTS student_feedback_responded_by_fkey;

ALTER TABLE public.student_feedback
ADD CONSTRAINT student_feedback_responded_by_fkey
FOREIGN KEY (responded_by)
REFERENCES public.profiles(id)
ON DELETE SET NULL;