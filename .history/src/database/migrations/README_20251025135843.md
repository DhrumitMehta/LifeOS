# Database Migrations

This directory contains SQL migration scripts for the LifeOS database schema.

## Migration Files

### 001_add_journal_structured_fields.sql
Adds new structured fields to the `journal_entries` table to support the enhanced journal format with:
- `memorable_moment` - Most memorable moment from yesterday
- `made_yesterday_better` - What or who made yesterday better  
- `improve_today` - What to improve on today
- `make_today_great` - What could make today great
- `yesterday_mood` - Whether yesterday was more positive or negative
- `affirmations` - Daily affirmations
- `open_thoughts` - Free-form thoughts and reflections

## How to Apply Migrations

### For Supabase
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the migration SQL
4. Execute the migration

### For Local SQLite
The migrations are automatically applied when the app starts if using the local SQLite database.

## Migration Order
Always apply migrations in numerical order (001, 002, etc.) to maintain database consistency.
