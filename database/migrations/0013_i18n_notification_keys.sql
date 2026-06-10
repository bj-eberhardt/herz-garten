alter table notifications
  add column if not exists title_key text,
  add column if not exists body_key text,
  add column if not exists params jsonb not null default '{}'::jsonb;
