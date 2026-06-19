-- Translation-only content storage.
-- Existing German base texts are copied into translation tables before the
-- duplicated text columns are removed from the base content tables.

create index if not exists idx_daily_question_translations_question_locale
  on public.daily_question_translations(question_id, locale);

create index if not exists idx_quest_translations_quest_locale
  on public.quest_translations(quest_id, locale);

create index if not exists idx_love_jar_template_translations_template_locale
  on public.love_jar_template_translations(template_id, locale);

create index if not exists idx_know_me_catalog_question_translations_question_locale
  on public.know_me_catalog_question_translations(catalog_question_id, locale);

create index if not exists idx_garden_level_translations_level_locale
  on public.garden_level_translations(level_id, locale);

insert into public.daily_question_translations (question_id, locale, text)
select id, 'de', text from public.daily_questions
on conflict (question_id, locale) do nothing;

insert into public.quest_translations (quest_id, locale, title, description)
select id, 'de', title, description from public.quests
on conflict (quest_id, locale) do nothing;

insert into public.love_jar_template_translations (template_id, locale, text)
select id, 'de', text from public.love_jar_templates
on conflict (template_id, locale) do nothing;

insert into public.know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label)
select id, 'de', question_text, category from public.know_me_catalog_questions
on conflict (catalog_question_id, locale) do nothing;

insert into public.garden_level_translations (level_id, locale, name)
select id, 'de', name from public.garden_levels
on conflict (level_id, locale) do nothing;

alter table public.daily_questions drop column if exists text;
alter table public.quests drop column if exists title, drop column if exists description;
alter table public.love_jar_templates drop column if exists text;
alter table public.know_me_catalog_questions drop column if exists question_text;
alter table public.garden_levels drop column if exists name;

alter table public.daily_question_translations alter column text set not null;
alter table public.quest_translations alter column title set not null;
alter table public.quest_translations alter column description set not null;
alter table public.love_jar_template_translations alter column text set not null;
alter table public.know_me_catalog_question_translations alter column question_text set not null;
alter table public.garden_level_translations alter column name set not null;
