-- Add habit_type column to existing habits table
ALTER TABLE habits ADD COLUMN habit_type TEXT CHECK (habit_type IN ('boolean', 'numeric'));

-- Set default value for existing habits (they will be boolean type)
UPDATE habits SET habit_type = 'boolean' WHERE habit_type IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE habits ALTER COLUMN habit_type SET NOT NULL;

-- Add a default value for future inserts
ALTER TABLE habits ALTER COLUMN habit_type SET DEFAULT 'boolean';
