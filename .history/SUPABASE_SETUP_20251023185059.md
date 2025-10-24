# Supabase Setup Guide for LifeOS

## Prerequisites
1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project in your Supabase dashboard

## Setup Steps

### 1. Get Your Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy your Project URL and anon/public key

### 2. Update Configuration
1. Open `src/config/supabase.ts`
2. Replace `YOUR_SUPABASE_URL` with your Project URL
3. Replace `YOUR_SUPABASE_ANON_KEY` with your anon key

### 3. Set Up Database Schema
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL script to create all necessary tables

### 4. Install Dependencies
```bash
npm install @supabase/supabase-js
```

## Fallback Behavior
If Supabase is not configured or fails to connect, the app will automatically fall back to using AsyncStorage for data persistence. This ensures the app continues to work even without Supabase setup.

## Database Schema
The app uses the following tables:
- `habits` - Stores habit definitions
- `habit_entries` - Stores daily habit completions
- `journal_entries` - Stores journal entries
- `transactions` - Stores financial transactions
- `investments` - Stores investment records
- `budgets` - Stores budget information
- `accounts` - Stores account information

## Testing
1. Start the app with `npm start`
2. Add a habit using the FAB button
3. Try completing the habit using the "Complete" button
4. Check that data persists after app restart
