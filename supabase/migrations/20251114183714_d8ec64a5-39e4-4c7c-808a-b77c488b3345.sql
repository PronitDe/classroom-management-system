-- Create notices table
CREATE TABLE public.notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notices
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Everyone can view notices
CREATE POLICY "Anyone can view notices"
ON public.notices
FOR SELECT
USING (true);

-- Only admins can insert notices
CREATE POLICY "Admins can insert notices"
ON public.notices
FOR INSERT
WITH CHECK (user_has_role(auth.uid(), 'ADMIN'));

-- Only admins can update notices
CREATE POLICY "Admins can update notices"
ON public.notices
FOR UPDATE
USING (user_has_role(auth.uid(), 'ADMIN'));

-- Only admins can delete notices
CREATE POLICY "Admins can delete notices"
ON public.notices
FOR DELETE
USING (user_has_role(auth.uid(), 'ADMIN'));

-- Create student_feedback table
CREATE TABLE public.student_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_REVIEW', 'RESOLVED')),
  response_message TEXT,
  responded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on student_feedback
ALTER TABLE public.student_feedback ENABLE ROW LEVEL SECURITY;

-- Students can insert their own feedback
CREATE POLICY "Students can insert their own feedback"
ON public.student_feedback
FOR INSERT
WITH CHECK (
  student_id = auth.uid() 
  AND user_has_role(auth.uid(), 'STUDENT')
);

-- Students can view their own feedback
CREATE POLICY "Students can view their own feedback"
ON public.student_feedback
FOR SELECT
USING (
  student_id = auth.uid()
  OR user_is_privileged(auth.uid())
);

-- SPOC and Admin can update feedback
CREATE POLICY "SPOC and Admin can update feedback"
ON public.student_feedback
FOR UPDATE
USING (user_is_privileged(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_student_feedback_updated_at
BEFORE UPDATE ON public.student_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();