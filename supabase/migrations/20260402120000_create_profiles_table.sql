-- My Profile (one row per LifeOS user; user_id = auth user UUID / app session id)

create table if not exists profiles (
  user_id text primary key,
  name text default '',
  bio text default '',
  likes jsonb not null default '[]'::jsonb,
  principles jsonb not null default '[]'::jsonb,
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  goals jsonb not null default '[]'::jsonb,
  interests jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_user_id on profiles (user_id);

comment on table profiles is 'LifeOS My Profile; scoped by user_id matching auth.users.id';
