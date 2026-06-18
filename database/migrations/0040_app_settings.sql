create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into app_settings (key, value)
values
  ('auth.adminJwtTtlMinutes', '60'::jsonb),
  ('auth.userJwtTtlMinutes', '10080'::jsonb)
on conflict (key) do nothing;
