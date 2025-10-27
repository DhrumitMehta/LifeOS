-- Migration: Add buying_price and selling_price fields to investments table for Supabase
-- This migration adds support for mutual fund pricing

-- Supabase PostgreSQL migration
ALTER TABLE investments ADD COLUMN IF NOT EXISTS buying_price DECIMAL(10,2);
ALTER TABLE investments ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2);

