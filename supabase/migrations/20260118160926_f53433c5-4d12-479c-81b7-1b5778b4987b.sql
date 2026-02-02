-- Drop the old sex constraint
ALTER TABLE student_registrations DROP CONSTRAINT IF EXISTS student_registrations_sex_check;

-- Add new constraint accepting both English and Portuguese values
ALTER TABLE student_registrations ADD CONSTRAINT student_registrations_sex_check 
CHECK (sex IN (
  'nao_informado', 'masculino', 'feminino',
  'male', 'female', 'not_informed'
) OR sex IS NULL);