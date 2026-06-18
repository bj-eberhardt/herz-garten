create table if not exists push_subscriptions (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_success_at timestamptz,
  last_failure_at timestamptz,
  failure_count integer not null default 0,
  disabled_at timestamptz
);

create unique index if not exists push_subscriptions_endpoint_idx
  on push_subscriptions (endpoint);

create index if not exists push_subscriptions_user_active_idx
  on push_subscriptions (user_id, updated_at desc)
  where disabled_at is null;
