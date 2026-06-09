create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  relationship_type text not null default 'mixed' check (relationship_type in ('local', 'long_distance', 'mixed')),
  content_preference text not null default 'balanced' check (content_preference in ('romantic', 'playful', 'deep', 'balanced')),
  heart_points integer not null default 0,
  garden_stage integer not null default 1,
  created_at timestamptz not null default now()
);

create table public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'partner' check (role in ('owner', 'partner')),
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

create table public.daily_questions (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  category text not null,
  depth_level integer not null check (depth_level between 1 and 4),
  long_distance_suitable boolean not null default true,
  active boolean not null default true
);

create table public.daily_question_answers (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  question_id uuid not null references public.daily_questions(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answer_text text not null,
  created_at timestamptz not null default now(),
  unique (couple_id, question_id, user_id)
);

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null check (category in ('romance', 'date', 'humor', 'memory', 'teamwork', 'long_distance')),
  estimated_minutes integer not null,
  effort_level text not null check (effort_level in ('low', 'medium', 'high')),
  reward_points integer not null default 0,
  reward_seed_type text,
  requires_both_partners boolean not null default true
);

create table public.couple_quests (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,
  status text not null default 'available' check (status in ('available', 'accepted', 'completed')),
  completed_by_user_ids uuid[] not null default '{}',
  completed_at timestamptz
);

create table public.garden_objects (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  type text not null check (type in ('flower', 'tree', 'bench', 'light', 'stone', 'pond', 'decoration')),
  source_type text not null check (source_type in ('question', 'quest', 'memory', 'love_jar', 'milestone')),
  source_id uuid,
  label text not null,
  position_x integer not null,
  position_y integer not null,
  level integer not null default 1,
  created_at timestamptz not null default now()
);

create table public.love_jar_notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  category text not null check (category in ('compliment', 'memory', 'voucher', 'wish', 'surprise')),
  is_drawn boolean not null default false,
  drawn_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.memory_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  date date not null,
  image_url text,
  category text not null check (category in ('date', 'travel', 'milestone', 'funny', 'everyday', 'special')),
  linked_garden_object_id uuid references public.garden_objects(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.daily_questions enable row level security;
alter table public.daily_question_answers enable row level security;
alter table public.quests enable row level security;
alter table public.couple_quests enable row level security;
alter table public.garden_objects enable row level security;
alter table public.love_jar_notes enable row level security;
alter table public.memory_entries enable row level security;

create policy "profiles are readable by owner" on public.profiles
  for select using (id = auth.uid());

create policy "profiles are editable by owner" on public.profiles
  for update using (id = auth.uid());

create policy "members can read their couples" on public.couples
  for select using (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = couples.id
      and couple_members.user_id = auth.uid()
    )
  );

create policy "members can read couple members" on public.couple_members
  for select using (
    exists (
      select 1 from public.couple_members own_membership
      where own_membership.couple_id = couple_members.couple_id
      and own_membership.user_id = auth.uid()
    )
  );

create policy "active questions are readable" on public.daily_questions
  for select using (active = true);

create policy "published quests are readable" on public.quests
  for select using (true);

create policy "members can read couple answers" on public.daily_question_answers
  for select using (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = daily_question_answers.couple_id
      and couple_members.user_id = auth.uid()
    )
  );

create policy "members can insert own answers" on public.daily_question_answers
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.couple_members
      where couple_members.couple_id = daily_question_answers.couple_id
      and couple_members.user_id = auth.uid()
    )
  );

create policy "members can read couple quests" on public.couple_quests
  for select using (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = couple_quests.couple_id
      and couple_members.user_id = auth.uid()
    )
  );

create policy "members can read garden objects" on public.garden_objects
  for select using (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = garden_objects.couple_id
      and couple_members.user_id = auth.uid()
    )
  );

create policy "members can read love jar notes" on public.love_jar_notes
  for select using (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = love_jar_notes.couple_id
      and couple_members.user_id = auth.uid()
    )
  );

create policy "members can read memories" on public.memory_entries
  for select using (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = memory_entries.couple_id
      and couple_members.user_id = auth.uid()
    )
  );
