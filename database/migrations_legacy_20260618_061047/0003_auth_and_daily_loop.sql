alter table profiles
  add column if not exists password_hash text;

update profiles
set password_hash = '$2b$12$VwXzQ5u0n9OeR4QKz8JqJuxcN7qJm2KQH0a9oZfC0mZqQh4oQd3rO'
where password_hash is null;

alter table profiles
  alter column password_hash set not null;

create table if not exists daily_question_instances (
  id uuid primary key,
  couple_id uuid not null references couples(id) on delete cascade,
  question_id uuid not null references daily_questions(id) on delete restrict,
  date date not null,
  reward_applied_at timestamptz,
  created_at timestamptz not null default now(),
  unique (couple_id, date)
);

create unique index if not exists one_question_reward_object_per_instance
  on garden_objects (source_type, source_id)
  where source_type = 'question' and source_id is not null;
