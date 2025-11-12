-- Update habit_entries value column from INTEGER to DECIMAL
-- This allows storing decimal values like 9.33 hours

ALTER TABLE habit_entries ALTER COLUMN value TYPE DECIMAL(10,2);
