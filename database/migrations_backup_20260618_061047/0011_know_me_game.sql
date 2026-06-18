alter table garden_objects
  drop constraint if exists garden_objects_source_type_check;

alter table garden_objects
  add constraint garden_objects_source_type_check
  check (source_type in ('question', 'quest', 'memory', 'love_jar', 'milestone', 'know_me'));

alter table notifications
  drop constraint if exists notifications_type_check;

alter table notifications
  add constraint notifications_type_check
  check (
    type in (
      'daily_answer_waiting',
      'daily_revealed',
      'quest_waiting_confirmation',
      'quest_completed',
      'love_jar_note',
      'memory_created',
      'know_me_question',
      'know_me_answered'
    )
  );

create table if not exists know_me_questions (
  id uuid primary key,
  couple_id uuid not null references couples(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  question_text text not null,
  options jsonb not null,
  correct_option_index integer not null check (correct_option_index between 0 and 3),
  status text not null default 'open' check (status in ('open', 'answered')),
  reward_applied_at timestamptz,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(options) = 'array'),
  check (jsonb_array_length(options) between 2 and 4),
  check (correct_option_index < jsonb_array_length(options))
);

create table if not exists know_me_guesses (
  id uuid primary key,
  question_id uuid not null references know_me_questions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  selected_option_index integer not null check (selected_option_index between 0 and 3),
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  unique (question_id, user_id)
);

create index if not exists know_me_questions_couple_created_idx
  on know_me_questions (couple_id, created_at desc);

create unique index if not exists one_know_me_garden_object_per_question
  on garden_objects (source_type, source_id)
  where source_type = 'know_me' and source_id is not null;
