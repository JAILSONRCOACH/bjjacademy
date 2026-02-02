-- Change day_of_week from single integer to integer array for multiple days
ALTER TABLE public.class_slots 
  DROP CONSTRAINT IF EXISTS class_slots_day_of_week_check;

ALTER TABLE public.class_slots 
  ALTER COLUMN day_of_week TYPE integer[] USING ARRAY[day_of_week];