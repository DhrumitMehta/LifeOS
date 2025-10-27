-- Migration: Add fund_name field to investments table
-- This migration adds support for storing specific fund names

-- SQLite migration
ALTER TABLE investments ADD COLUMN fund_name TEXT;

