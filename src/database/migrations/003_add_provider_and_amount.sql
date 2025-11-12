-- Migration: Add provider and amount_purchased fields to investments table
-- This migration adds support for fund providers and amount tracking for mutual funds

-- SQLite migration
ALTER TABLE investments ADD COLUMN provider TEXT;
ALTER TABLE investments ADD COLUMN amount_purchased REAL;

