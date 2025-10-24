-- Add notification fields to existing habits table
ALTER TABLE habits ADD COLUMN notification_time TEXT;
ALTER TABLE habits ADD COLUMN notifications_enabled BOOLEAN NOT NULL DEFAULT false;

-- Set default values for existing habits
UPDATE habits SET notifications_enabled = false WHERE notifications_enabled IS NULL;
