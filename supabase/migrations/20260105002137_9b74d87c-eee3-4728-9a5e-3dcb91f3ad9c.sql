-- Add class_slot_id column to attendance table
ALTER TABLE public.attendance 
ADD COLUMN class_slot_id uuid REFERENCES public.class_slots(id);

-- Create index for better performance
CREATE INDEX idx_attendance_class_slot_id ON public.attendance(class_slot_id);