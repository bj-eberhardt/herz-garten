-- Indexes matched to the repository query patterns after the schema became
-- translation-only. Some indexes from 0001 referenced text/title/label columns
-- that are dropped by later migrations, so replacement indexes live here.

create unique index if not exists couples_invite_code_lower_idx
  on public.couples (lower(invite_code));

create index if not exists couples_created_idx
  on public.couples (created_at desc);

create index if not exists profiles_created_idx
  on public.profiles (created_at desc);

create index if not exists couple_members_user_couple_idx
  on public.couple_members (user_id, couple_id);

create index if not exists couple_quests_couple_completed_idx
  on public.couple_quests (couple_id, completed_at);

create index if not exists content_categories_type_active_sort_value_idx
  on public.content_categories (content_type, active, sort_order, value);

create index if not exists daily_questions_active_category_idx
  on public.daily_questions (active, category);

create index if not exists daily_question_answers_couple_question_created_idx
  on public.daily_question_answers (couple_id, question_id, created_at);

create index if not exists daily_question_answers_user_couple_question_idx
  on public.daily_question_answers (user_id, couple_id, question_id);

create index if not exists daily_question_instances_couple_question_date_idx
  on public.daily_question_instances (couple_id, question_id, date);

create index if not exists garden_objects_couple_created_idx
  on public.garden_objects (couple_id, created_at);

create index if not exists garden_objects_couple_source_created_idx
  on public.garden_objects (couple_id, source_type, source_id, created_at desc)
  where source_id is not null;

create index if not exists know_me_catalog_questions_active_category_sort_idx
  on public.know_me_catalog_questions (active, category, sort_order);

create index if not exists know_me_questions_author_idx
  on public.know_me_questions (author_id);

create index if not exists love_jar_notes_couple_created_idx
  on public.love_jar_notes (couple_id, created_at desc);

create index if not exists love_jar_notes_couple_unread_author_idx
  on public.love_jar_notes (couple_id, author_id)
  where is_drawn = false;

create index if not exists love_jar_notes_author_idx
  on public.love_jar_notes (author_id);

create index if not exists love_jar_templates_active_category_sort_idx
  on public.love_jar_templates (active, category, sort_order);

create index if not exists memory_entries_couple_date_created_idx
  on public.memory_entries (couple_id, date desc, created_at desc);

create index if not exists memory_entries_author_idx
  on public.memory_entries (author_id);

create index if not exists notifications_couple_created_idx
  on public.notifications (couple_id, created_at desc)
  where couple_id is not null;

create index if not exists quests_active_category_idx
  on public.quests (active, category);
