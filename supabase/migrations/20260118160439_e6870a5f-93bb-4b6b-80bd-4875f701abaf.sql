-- Drop the old constraint
ALTER TABLE student_registrations DROP CONSTRAINT IF EXISTS student_registrations_belt_current_check;

-- Add new constraint with all belt types (English values from belt_type enum)
ALTER TABLE student_registrations ADD CONSTRAINT student_registrations_belt_current_check 
CHECK (belt_current IN (
  'white', 'grey_white', 'grey', 'grey_black',
  'yellow_white', 'yellow', 'yellow_black',
  'orange_white', 'orange', 'orange_black',
  'green_white', 'green', 'green_black',
  'blue', 'purple', 'brown', 'black',
  'red_black', 'red_white', 'red',
  -- Also keep Portuguese values for backward compatibility
  'branca', 'azul', 'roxa', 'marrom', 'preta'
));