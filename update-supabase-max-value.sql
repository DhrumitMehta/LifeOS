-- Add max_value column to existing habits table
ALTER TABLE habits ADD COLUMN max_value INTEGER;

-- Set default value for existing habits (they will be null for boolean habits)
-- No need to update existing records as max_value is only for numeric habits

-- The column can remain nullable since boolean habits don't need max_value
