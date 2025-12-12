-- Migration: Add Reviews Table
-- Run this in your Supabase SQL Editor to add the reviews feature

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('monthly', 'yearly')),
    period TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    journal_stats JSONB,
    habit_stats JSONB,
    finance_stats JSONB,
    reflections TEXT,
    achievements TEXT,
    challenges TEXT,
    goals_for_next_period TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_type ON reviews(type);
CREATE INDEX IF NOT EXISTS idx_reviews_period ON reviews(period);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (you may want to restrict this based on your auth requirements)
CREATE POLICY "Enable all operations for all users" ON reviews FOR ALL USING (true);

-- Optional: If you want to allow only authenticated users, use this instead:
-- CREATE POLICY "Enable all operations for authenticated users" ON reviews FOR ALL USING (auth.role() = 'authenticated');

