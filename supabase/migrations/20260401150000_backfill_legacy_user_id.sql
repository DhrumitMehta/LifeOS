-- Assign all legacy rows (user_id IS NULL) to your Supabase Auth user.
-- UUID from Settings → Account (auth.users.id).

UPDATE habits SET user_id = '3a748f2c-f765-418a-aa36-2a871310a577' WHERE user_id IS NULL;
UPDATE habit_entries SET user_id = '3a748f2c-f765-418a-aa36-2a871310a577' WHERE user_id IS NULL;
UPDATE journal_entries SET user_id = '3a748f2c-f765-418a-aa36-2a871310a577' WHERE user_id IS NULL;
UPDATE transactions SET user_id = '3a748f2c-f765-418a-aa36-2a871310a577' WHERE user_id IS NULL;
UPDATE investments SET user_id = '3a748f2c-f765-418a-aa36-2a871310a577' WHERE user_id IS NULL;
UPDATE budgets SET user_id = '3a748f2c-f765-418a-aa36-2a871310a577' WHERE user_id IS NULL;
UPDATE accounts SET user_id = '3a748f2c-f765-418a-aa36-2a871310a577' WHERE user_id IS NULL;
UPDATE subscriptions SET user_id = '3a748f2c-f765-418a-aa36-2a871310a577' WHERE user_id IS NULL;
UPDATE reviews SET user_id = '3a748f2c-f765-418a-aa36-2a871310a577' WHERE user_id IS NULL;
