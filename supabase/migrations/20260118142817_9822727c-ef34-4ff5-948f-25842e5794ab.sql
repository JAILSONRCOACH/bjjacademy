-- Step 1: Drop the function that depends on belt_type
DROP FUNCTION IF EXISTS public.promote_student_belt(uuid, belt_type, text);

-- Step 2: Drop the process_attendance_progression function that references belt_type
DROP FUNCTION IF EXISTS public.process_attendance_progression();

-- Step 3: Drop old belt_type_new if it exists from failed migration
DROP TYPE IF EXISTS belt_type_new;

-- Step 4: Create new temporary column for each table to hold the text value
ALTER TABLE profiles ADD COLUMN belt_text text;
UPDATE profiles SET belt_text = belt::text;

ALTER TABLE students ADD COLUMN belt_current_text text;
UPDATE students SET belt_current_text = belt_current::text;

ALTER TABLE belt_rules ADD COLUMN belt_text text;
UPDATE belt_rules SET belt_text = belt::text;

ALTER TABLE belt_history ADD COLUMN new_belt_text text;
ALTER TABLE belt_history ADD COLUMN previous_belt_text text;
UPDATE belt_history SET new_belt_text = new_belt::text, previous_belt_text = previous_belt::text;

ALTER TABLE belt_promotions ADD COLUMN from_belt_text text;
ALTER TABLE belt_promotions ADD COLUMN to_belt_text text;
UPDATE belt_promotions SET from_belt_text = from_belt::text, to_belt_text = to_belt::text;

ALTER TABLE stripe_events ADD COLUMN belt_text text;
UPDATE stripe_events SET belt_text = belt::text;

-- Step 5: Drop the old columns
ALTER TABLE profiles DROP COLUMN belt;
ALTER TABLE students DROP COLUMN belt_current;
ALTER TABLE belt_rules DROP COLUMN belt;
ALTER TABLE belt_history DROP COLUMN new_belt;
ALTER TABLE belt_history DROP COLUMN previous_belt;
ALTER TABLE belt_promotions DROP COLUMN from_belt;
ALTER TABLE belt_promotions DROP COLUMN to_belt;
ALTER TABLE stripe_events DROP COLUMN belt;

-- Step 6: Drop old type
DROP TYPE IF EXISTS belt_type;

-- Step 7: Create new belt type enum with all IBJJF belts
CREATE TYPE belt_type AS ENUM (
  'white', 'grey_white', 'grey', 'grey_black',
  'yellow_white', 'yellow', 'yellow_black',
  'orange_white', 'orange', 'orange_black',
  'green_white', 'green', 'green_black',
  'blue', 'purple', 'brown', 'black',
  'red_black', 'red_white', 'red'
);

-- Step 8: Create new columns with new type and copy data
ALTER TABLE profiles ADD COLUMN belt belt_type DEFAULT 'white';
UPDATE profiles SET belt = belt_text::belt_type WHERE belt_text IS NOT NULL;
ALTER TABLE profiles DROP COLUMN belt_text;

ALTER TABLE students ADD COLUMN belt_current belt_type DEFAULT 'white';
UPDATE students SET belt_current = belt_current_text::belt_type WHERE belt_current_text IS NOT NULL;
ALTER TABLE students DROP COLUMN belt_current_text;

ALTER TABLE belt_rules ADD COLUMN belt belt_type;
UPDATE belt_rules SET belt = belt_text::belt_type WHERE belt_text IS NOT NULL;
ALTER TABLE belt_rules DROP COLUMN belt_text;

ALTER TABLE belt_history ADD COLUMN new_belt belt_type;
ALTER TABLE belt_history ADD COLUMN previous_belt belt_type;
UPDATE belt_history SET new_belt = new_belt_text::belt_type WHERE new_belt_text IS NOT NULL;
UPDATE belt_history SET previous_belt = previous_belt_text::belt_type WHERE previous_belt_text IS NOT NULL;
ALTER TABLE belt_history DROP COLUMN new_belt_text;
ALTER TABLE belt_history DROP COLUMN previous_belt_text;

ALTER TABLE belt_promotions ADD COLUMN from_belt belt_type;
ALTER TABLE belt_promotions ADD COLUMN to_belt belt_type;
UPDATE belt_promotions SET from_belt = from_belt_text::belt_type WHERE from_belt_text IS NOT NULL;
UPDATE belt_promotions SET to_belt = to_belt_text::belt_type WHERE to_belt_text IS NOT NULL;
ALTER TABLE belt_promotions DROP COLUMN from_belt_text;
ALTER TABLE belt_promotions DROP COLUMN to_belt_text;

ALTER TABLE stripe_events ADD COLUMN belt belt_type;
UPDATE stripe_events SET belt = belt_text::belt_type WHERE belt_text IS NOT NULL;
ALTER TABLE stripe_events DROP COLUMN belt_text;