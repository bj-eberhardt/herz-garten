create table if not exists profiles (
  id uuid primary key,
  email text not null unique,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists couples (
  id uuid primary key,
  invite_code text not null unique,
  relationship_type text not null default 'mixed' check (relationship_type in ('local', 'long_distance', 'mixed')),
  content_preference text not null default 'balanced' check (content_preference in ('romantic', 'playful', 'deep', 'balanced')),
  heart_points integer not null default 0,
  garden_stage integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists couple_members (
  couple_id uuid not null references couples(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'partner' check (role in ('owner', 'partner')),
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

create table if not exists daily_questions (
  id uuid primary key,
  text text not null,
  category text not null,
  depth_level integer not null check (depth_level between 1 and 4),
  long_distance_suitable boolean not null default true,
  active boolean not null default true
);

create table if not exists daily_question_answers (
  id uuid primary key,
  couple_id uuid not null references couples(id) on delete cascade,
  question_id uuid not null references daily_questions(id) on delete restrict,
  user_id uuid not null references profiles(id) on delete cascade,
  answer_text text not null,
  created_at timestamptz not null default now(),
  unique (couple_id, question_id, user_id)
);

create table if not exists quests (
  id uuid primary key,
  title text not null,
  description text not null,
  category text not null check (category in ('romance', 'date', 'humor', 'memory', 'teamwork', 'long_distance')),
  estimated_minutes integer not null,
  effort_level text not null check (effort_level in ('low', 'medium', 'high')),
  reward_points integer not null default 0,
  reward_seed_type text,
  requires_both_partners boolean not null default true
);

create table if not exists couple_quests (
  id uuid primary key,
  couple_id uuid not null references couples(id) on delete cascade,
  quest_id uuid not null references quests(id) on delete cascade,
  status text not null default 'available' check (status in ('available', 'accepted', 'completed')),
  completed_by_user_ids uuid[] not null default '{}',
  completed_at timestamptz
);

create table if not exists garden_objects (
  id uuid primary key,
  couple_id uuid not null references couples(id) on delete cascade,
  type text not null check (type in ('flower', 'tree', 'bench', 'light', 'stone', 'pond', 'decoration')),
  source_type text not null check (source_type in ('question', 'quest', 'memory', 'love_jar', 'milestone')),
  source_id uuid,
  label text not null,
  position_x integer not null,
  position_y integer not null,
  level integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists love_jar_notes (
  id uuid primary key,
  couple_id uuid not null references couples(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  text text not null,
  category text not null check (category in ('compliment', 'memory', 'voucher', 'wish', 'surprise')),
  is_drawn boolean not null default false,
  drawn_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists memory_entries (
  id uuid primary key,
  couple_id uuid not null references couples(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  date date not null,
  image_url text,
  category text not null check (category in ('date', 'travel', 'milestone', 'funny', 'everyday', 'special')),
  linked_garden_object_id uuid references garden_objects(id) on delete set null,
  created_at timestamptz not null default now()
);

