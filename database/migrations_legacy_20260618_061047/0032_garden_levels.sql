create extension if not exists pgcrypto;

create table if not exists garden_levels (
  id uuid primary key,
  stage integer not null unique check (stage >= 1),
  name text not null,
  points_to_next integer check (points_to_next is null or points_to_next > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists garden_level_translations (
  level_id uuid not null references garden_levels(id) on delete cascade,
  locale text not null references supported_locales(locale) on delete restrict,
  name text not null,
  primary key (level_id, locale)
);

with levels(stage, name, points_to_next) as (
  values
    (1, 'Herzbeet', 200),
    (2, 'Blumenwiese', 200),
    (3, 'Banklichtung', 200),
    (4, 'Erinnerungsbereich', 200),
    (5, 'Lichterwiese', 200),
    (6, 'Teich der Ruhe', 200),
    (7, 'Picknickplatz', 200),
    (8, 'Sternenwiese', 200),
    (9, 'Wunschbrunnen', 200),
    (10, 'Gartenfest', null)
)
insert into garden_levels (id, stage, name, points_to_next, updated_at)
select gen_random_uuid(), stage, name, points_to_next, now()
from levels
on conflict (stage) do update
set name = excluded.name,
    points_to_next = excluded.points_to_next,
    updated_at = now();

with labels(stage, locale, name) as (
  values
    (1, 'de', 'Herzbeet'),
    (1, 'en', 'Heart Bed'),
    (2, 'de', 'Blumenwiese'),
    (2, 'en', 'Flower Meadow'),
    (3, 'de', 'Banklichtung'),
    (3, 'en', 'Bench Grove'),
    (4, 'de', 'Erinnerungsbereich'),
    (4, 'en', 'Memory Tree'),
    (5, 'de', 'Lichterwiese'),
    (5, 'en', 'Light Meadow'),
    (6, 'de', 'Teich der Ruhe'),
    (6, 'en', 'Quiet Pond'),
    (7, 'de', 'Picknickplatz'),
    (7, 'en', 'Picnic Place'),
    (8, 'de', 'Sternenwiese'),
    (8, 'en', 'Star Meadow'),
    (9, 'de', 'Wunschbrunnen'),
    (9, 'en', 'Wishing Well'),
    (10, 'de', 'Gartenfest'),
    (10, 'en', 'Garden Fest')
)
insert into garden_level_translations (level_id, locale, name)
select gl.id, labels.locale, labels.name
from labels
join garden_levels gl on gl.stage = labels.stage
on conflict (level_id, locale) do update set name = excluded.name;
