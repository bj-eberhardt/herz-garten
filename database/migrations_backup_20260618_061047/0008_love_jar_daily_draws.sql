create table if not exists love_jar_draws (
  id uuid primary key,
  couple_id uuid not null references couples(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  note_id uuid not null references love_jar_notes(id) on delete cascade,
  drawn_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (couple_id, user_id, drawn_date)
);

create index if not exists love_jar_draws_couple_user_date_idx
  on love_jar_draws (couple_id, user_id, drawn_date desc);
