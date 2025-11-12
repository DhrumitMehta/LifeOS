-- Migration: Add provider and amount_purchased fields to investments table for Supabase
-- This migration adds support for fund providers and amount tracking for mutual funds

-- Supabase PostgreSQL migration
ALTER TABLE investments ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS amount_purchased DECIMAL(10,2);

