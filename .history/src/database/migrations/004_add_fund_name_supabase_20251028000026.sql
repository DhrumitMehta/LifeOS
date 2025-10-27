-- Migration: Add fund_name field to investments table for Supabase
-- This migration adds support for storing specific fund names

-- Supabase PostgreSQL migration
ALTER TABLE investments ADD COLUMN IF NOT EXISTS fund_name TEXT;

