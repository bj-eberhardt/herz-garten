create table if not exists notifications (
  id uuid primary key,
  couple_id uuid not null references couples(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (
    type in (
      'daily_answer_waiting',
      'daily_revealed',
      'quest_waiting_confirmation',
      'quest_completed',
      'love_jar_note',
      'memory_created'
    )
  ),
  title text not null,
  body text not null,
  source_type text not null,
  source_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on notifications (user_id, created_at desc)
  where read_at is null;

create unique index if not exists notifications_dedupe_source_idx
  on notifications (user_id, type, source_type, source_id)
  where source_id is not null;
