alter table quests
  drop constraint if exists quests_category_check;

alter table love_jar_templates
  drop constraint if exists love_jar_templates_category_check;

create extension if not exists pgcrypto;

create table if not exists content_categories (
  id uuid primary key,
  content_type text not null check (content_type in ('daily-questions', 'quests', 'know-me-catalog', 'love-jar-templates')),
  value text not null,
  label text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_type, value)
);

create index if not exists content_categories_type_active_sort_idx
  on content_categories (content_type, active, sort_order, label);

create table if not exists content_category_translations (
  category_id uuid not null references content_categories(id) on delete cascade,
  locale text not null references supported_locales(locale) on delete restrict,
  label text not null,
  primary key (category_id, locale)
);

insert into content_categories (id, content_type, value, label, sort_order)
select gen_random_uuid(), source.content_type, source.value, source.value, source.sort_order
from (
  select 'daily-questions' as content_type, category as value, min(category) as label, dense_rank() over (order by category) * 10 as sort_order
  from daily_questions
  group by category
  union all
  select 'quests' as content_type, category as value, min(category) as label, dense_rank() over (order by category) * 10 as sort_order
  from quests
  group by category
  union all
  select 'know-me-catalog' as content_type, category as value, min(category) as label, dense_rank() over (order by category) * 10 as sort_order
  from know_me_catalog_questions
  group by category
  union all
  select 'love-jar-templates' as content_type, category as value, min(category) as label, dense_rank() over (order by category) * 10 as sort_order
  from love_jar_templates
  group by category
) source
on conflict (content_type, value) do nothing;

insert into content_category_translations (category_id, locale, label)
select id, 'de', label
from content_categories
on conflict (category_id, locale) do nothing;
