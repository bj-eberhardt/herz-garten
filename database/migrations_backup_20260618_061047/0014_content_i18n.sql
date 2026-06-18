create table if not exists supported_locales (
  locale text primary key,
  label text not null,
  active boolean not null default true,
  is_default boolean not null default false
);

create unique index if not exists supported_locales_single_default_idx
  on supported_locales (is_default)
  where is_default = true;

insert into supported_locales (locale, label, active, is_default)
values
  ('de', 'Deutsch', true, true),
  ('en', 'English', true, false)
on conflict (locale) do update
set
  label = excluded.label,
  active = excluded.active,
  is_default = excluded.is_default;

create table if not exists daily_question_translations (
  question_id uuid not null references daily_questions(id) on delete cascade,
  locale text not null references supported_locales(locale) on delete restrict,
  text text not null,
  primary key (question_id, locale)
);

create table if not exists quest_translations (
  quest_id uuid not null references quests(id) on delete cascade,
  locale text not null references supported_locales(locale) on delete restrict,
  title text not null,
  description text not null,
  primary key (quest_id, locale)
);

create table if not exists know_me_catalog_question_translations (
  catalog_question_id uuid not null references know_me_catalog_questions(id) on delete cascade,
  locale text not null references supported_locales(locale) on delete restrict,
  question_text text not null,
  category_label text not null,
  primary key (catalog_question_id, locale)
);

insert into daily_question_translations (question_id, locale, text)
select id, 'de', text
from daily_questions
on conflict (question_id, locale) do nothing;

insert into quest_translations (quest_id, locale, title, description)
select id, 'de', title, description
from quests
on conflict (quest_id, locale) do nothing;

insert into know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label)
select id, 'de', question_text, category
from know_me_catalog_questions
on conflict (catalog_question_id, locale) do nothing;

insert into daily_question_translations (question_id, locale, text)
values
  ('00000000-0000-0000-0000-000000000101', 'en', 'What was a moment when you felt loved by me?'),
  ('00000000-0000-0000-0000-000000000102', 'en', 'Which small gesture from me means a lot to you?'),
  ('00000000-0000-0000-0000-000000000103', 'en', 'What would you like us to do together again soon?')
on conflict (question_id, locale) do update
set text = excluded.text;

insert into quest_translations (quest_id, locale, title, description)
values
  ('00000000-0000-0000-0000-000000000201', 'en', 'Three Compliments', 'Write each other three specific compliments.'),
  ('00000000-0000-0000-0000-000000000202', 'en', 'Phone-Free Walk', 'Go for a walk together and keep your phones in your pockets.'),
  ('00000000-0000-0000-0000-000000000203', 'en', 'Current Moment', 'Send each other a photo of your current moment.')
on conflict (quest_id, locale) do update
set
  title = excluded.title,
  description = excluded.description;

insert into know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label)
values
  ('00000000-0000-0000-0000-000000001201', 'en', 'What would my perfect Sunday look like?', 'Everyday life'),
  ('00000000-0000-0000-0000-000000001202', 'en', 'What is my secret favorite snack?', 'Preferences'),
  ('00000000-0000-0000-0000-000000001203', 'en', 'What stresses me more: clutter or time pressure?', 'Stress'),
  ('00000000-0000-0000-0000-000000001204', 'en', 'Which place helps me feel calm?', 'Calm')
on conflict (catalog_question_id, locale) do update
set
  question_text = excluded.question_text,
  category_label = excluded.category_label;
