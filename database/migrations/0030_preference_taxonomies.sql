create extension if not exists pgcrypto;

alter table couples
  drop constraint if exists couples_relationship_type_check;

alter table couples
  drop constraint if exists couples_content_preference_check;

create table if not exists relationship_modes (
  id uuid primary key,
  value text not null unique,
  label text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists relationship_mode_translations (
  mode_id uuid not null references relationship_modes(id) on delete cascade,
  locale text not null references supported_locales(locale) on delete restrict,
  label text not null,
  primary key (mode_id, locale)
);

create table if not exists content_styles (
  id uuid primary key,
  value text not null unique,
  label text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists content_style_translations (
  style_id uuid not null references content_styles(id) on delete cascade,
  locale text not null references supported_locales(locale) on delete restrict,
  label text not null,
  primary key (style_id, locale)
);

alter table content_categories
  add column if not exists relationship_modes text[] not null default '{}',
  add column if not exists content_styles text[] not null default '{}';

create index if not exists content_categories_relationship_modes_gin_idx
  on content_categories using gin (relationship_modes);

create index if not exists content_categories_content_styles_gin_idx
  on content_categories using gin (content_styles);

with modes(value, de_label, en_label, sort_order) as (
  values
    ('mixed', 'Gemischt', 'Mixed', 10),
    ('local', 'Zusammen vor Ort', 'Together locally', 20),
    ('long_distance', 'Fernbeziehung', 'Long distance', 30)
)
insert into relationship_modes (id, value, label, active, sort_order, updated_at)
select gen_random_uuid(), value, de_label, true, sort_order, now()
from modes
on conflict (value) do update
set label = excluded.label,
    sort_order = excluded.sort_order,
    updated_at = now();

with labels(value, locale, label) as (
  values
    ('mixed', 'de', 'Gemischt'),
    ('mixed', 'en', 'Mixed'),
    ('local', 'de', 'Zusammen vor Ort'),
    ('local', 'en', 'Together locally'),
    ('long_distance', 'de', 'Fernbeziehung'),
    ('long_distance', 'en', 'Long distance')
)
insert into relationship_mode_translations (mode_id, locale, label)
select m.id, labels.locale, labels.label
from labels
join relationship_modes m on m.value = labels.value
on conflict (mode_id, locale) do update set label = excluded.label;

with styles(value, de_label, en_label, sort_order) as (
  values
    ('balanced', 'Ausgewogen', 'Balanced', 10),
    ('romantic', 'Romantisch', 'Romantic', 20),
    ('playful', 'Verspielt', 'Playful', 30),
    ('deep', 'Tiefgründig', 'Deep', 40)
)
insert into content_styles (id, value, label, active, sort_order, updated_at)
select gen_random_uuid(), value, de_label, true, sort_order, now()
from styles
on conflict (value) do update
set label = excluded.label,
    sort_order = excluded.sort_order,
    updated_at = now();

with labels(value, locale, label) as (
  values
    ('balanced', 'de', 'Ausgewogen'),
    ('balanced', 'en', 'Balanced'),
    ('romantic', 'de', 'Romantisch'),
    ('romantic', 'en', 'Romantic'),
    ('playful', 'de', 'Verspielt'),
    ('playful', 'en', 'Playful'),
    ('deep', 'de', 'Tiefgründig'),
    ('deep', 'en', 'Deep')
)
insert into content_style_translations (style_id, locale, label)
select s.id, labels.locale, labels.label
from labels
join content_styles s on s.value = labels.value
on conflict (style_id, locale) do update set label = excluded.label;

update content_categories
set content_styles = array['romantic']
where value in ('romance', 'gratitude', 'connection', 'compliment');

update content_categories
set content_styles = array['playful']
where value in ('humor', 'date', 'ritual', 'funny', 'surprise');

update content_categories
set content_styles = array['deep']
where value in ('deep', 'trust', 'future', 'support', 'memory', 'milestone');

update content_categories
set relationship_modes = array['long_distance']
where value = 'long_distance';
