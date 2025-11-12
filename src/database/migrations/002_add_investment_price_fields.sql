-- Migration: Add buying_price and selling_price fields to investments table
-- This migration adds support for mutual fund pricing

-- SQLite migration
ALTER TABLE investments ADD COLUMN buying_price REAL;
ALTER TABLE investments ADD COLUMN selling_price REAL;

