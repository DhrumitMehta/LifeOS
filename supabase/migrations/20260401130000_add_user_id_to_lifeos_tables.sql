-- LifeOS: per-profile rows (user_id matches app auth id, e.g. u_1733123456789_abc123)
-- Run via Supabase SQL Editor or: supabase db push

alter table habits add column if not exists user_id text;
alter table habit_entries add column if not exists user_id text;
alter table journal_entries add column if not exists user_id text;
alter table transactions add column if not exists user_id text;
alter table investments add column if not exists user_id text;
alter table budgets add column if not exists user_id text;
alter table accounts add column if not exists user_id text;
alter table subscriptions add column if not exists user_id text;
alter table reviews add column if not exists user_id text;

create index if not exists idx_habits_user_id on habits (user_id);
create index if not exists idx_habit_entries_user_id on habit_entries (user_id);
create index if not exists idx_journal_entries_user_id on journal_entries (user_id);
create index if not exists idx_transactions_user_id on transactions (user_id);
create index if not exists idx_investments_user_id on investments (user_id);
create index if not exists idx_budgets_user_id on budgets (user_id);
create index if not exists idx_accounts_user_id on accounts (user_id);
create index if not exists idx_subscriptions_user_id on subscriptions (user_id);
create index if not exists idx_reviews_user_id on reviews (user_id);

-- Legacy rows: the app only loads rows where user_id = signed-in user.
-- To assign old data to your first profile, copy "User ID" from Settings → Account, then:
-- update habits set user_id = 'YOUR_ID' where user_id is null;
-- (repeat per table as needed)
