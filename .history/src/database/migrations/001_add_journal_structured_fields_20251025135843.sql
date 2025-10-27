-- Migration: Add structured fields to journal_entries table
-- This migration adds the new structured journal fields to support the enhanced journal format

-- Add new columns to journal_entries table
ALTER TABLE journal_entries 
ADD COLUMN memorable_moment TEXT,
ADD COLUMN made_yesterday_better TEXT,
ADD COLUMN improve_today TEXT,
ADD COLUMN make_today_great TEXT,
ADD COLUMN yesterday_mood TEXT CHECK (yesterday_mood IN ('positive', 'negative')),
ADD COLUMN affirmations TEXT,
ADD COLUMN open_thoughts TEXT;

-- Add comment to document the new fields
COMMENT ON COLUMN journal_entries.memorable_moment IS 'Most memorable moment from yesterday';
COMMENT ON COLUMN journal_entries.made_yesterday_better IS 'What or who made yesterday better';
COMMENT ON COLUMN journal_entries.improve_today IS 'What to improve on today';
COMMENT ON COLUMN journal_entries.make_today_great IS 'What could make today great';
COMMENT ON COLUMN journal_entries.yesterday_mood IS 'Whether yesterday was more positive or negative';
COMMENT ON COLUMN journal_entries.affirmations IS 'Daily affirmations';
COMMENT ON COLUMN journal_entries.open_thoughts IS 'Free-form thoughts and reflections';
