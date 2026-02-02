
-- Create attendance status enum
CREATE TYPE public.attendance_status AS ENUM ('pending', 'approved', 'rejected');

-- Create attendance source enum
CREATE TYPE public.attendance_source AS ENUM ('app', 'manual', 'qrcode');

-- Add new columns to attendance table
ALTER TABLE public.attendance 
ADD COLUMN status public.attendance_status NOT NULL DEFAULT 'pending',
ADD COLUMN source public.attendance_source NOT NULL DEFAULT 'app',
ADD COLUMN validated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN validated_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster filtering
CREATE INDEX idx_attendance_status ON public.attendance(status);
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);

-- Create trigger function to update student progression when attendance is approved
CREATE OR REPLACE FUNCTION public.process_attendance_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
  v_rule RECORD;
  v_next_belt public.belt_type;
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Get the student record from students table
    SELECT * INTO v_student FROM public.students WHERE id = NEW.student_id;
    
    IF v_student IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Increment class counters
    UPDATE public.students 
    SET 
      total_classes = total_classes + 1,
      belt_cycle_classes = belt_cycle_classes + 1
    WHERE id = NEW.student_id;
    
    -- Reload updated student data
    SELECT * INTO v_student FROM public.students WHERE id = NEW.student_id;
    
    -- Get belt rule for current belt
    SELECT * INTO v_rule 
    FROM public.belt_rules 
    WHERE academy_id = v_student.academy_id AND belt = v_student.belt_current;
    
    -- If no rule or black belt with very high value (locked), skip stripe logic
    IF v_rule IS NULL OR v_rule.classes_per_stripe > 99999 THEN
      RETURN NEW;
    END IF;
    
    -- Check if student should earn a stripe
    IF v_student.belt_cycle_classes >= v_rule.classes_per_stripe THEN
      IF v_student.stripes_cached < 4 THEN
        -- Add stripe
        UPDATE public.students 
        SET 
          stripes_cached = stripes_cached + 1,
          belt_cycle_classes = 0
        WHERE id = NEW.student_id;
      ELSIF v_student.stripes_cached >= 4 AND v_student.belt_current != 'black' THEN
        -- Promote belt
        v_next_belt := CASE v_student.belt_current
          WHEN 'white' THEN 'blue'::public.belt_type
          WHEN 'blue' THEN 'purple'::public.belt_type
          WHEN 'purple' THEN 'brown'::public.belt_type
          WHEN 'brown' THEN 'black'::public.belt_type
          ELSE v_student.belt_current
        END;
        
        UPDATE public.students 
        SET 
          belt_current = v_next_belt,
          stripes_cached = 0,
          belt_cycle_classes = 0
        WHERE id = NEW.student_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for attendance approval
DROP TRIGGER IF EXISTS on_attendance_approval ON public.attendance;
CREATE TRIGGER on_attendance_approval
AFTER UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.process_attendance_approval();

-- Update RLS policies for attendance

-- Drop existing policies first
DROP POLICY IF EXISTS "Admins and professors can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can delete attendance" ON public.attendance;
DROP POLICY IF EXISTS "Students can view their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can view attendance in their academy" ON public.attendance;

-- New policies

-- Admin can do everything in their academy
CREATE POLICY "Admins full access to attendance"
ON public.attendance
FOR ALL
USING (
  academy_id = get_user_academy_id(auth.uid()) 
  AND get_user_role(auth.uid()) = 'admin'
);

-- Professors can view and update attendance for their students
CREATE POLICY "Professors can view attendance for their students"
ON public.attendance
FOR SELECT
USING (
  academy_id = get_user_academy_id(auth.uid())
  AND get_user_role(auth.uid()) = 'professor'
  AND student_id IN (
    SELECT id FROM public.students 
    WHERE responsible_instructor_id = auth.uid()
  )
);

CREATE POLICY "Professors can update attendance for their students"
ON public.attendance
FOR UPDATE
USING (
  academy_id = get_user_academy_id(auth.uid())
  AND get_user_role(auth.uid()) = 'professor'
  AND student_id IN (
    SELECT id FROM public.students 
    WHERE responsible_instructor_id = auth.uid()
  )
);

-- Students can view their own attendance
CREATE POLICY "Students view own attendance"
ON public.attendance
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students WHERE profile_id = auth.uid()
  )
);

-- Students can insert their own check-in
CREATE POLICY "Students can check in"
ON public.attendance
FOR INSERT
WITH CHECK (
  academy_id = get_user_academy_id(auth.uid())
  AND student_id IN (
    SELECT id FROM public.students WHERE profile_id = auth.uid()
  )
  AND status = 'pending'
);
