alter table content_categories
  drop constraint if exists content_categories_content_type_check;

alter table content_categories
  add constraint content_categories_content_type_check
  check (content_type in ('daily-questions', 'quests', 'know-me-catalog', 'love-jar-templates', 'memories'));

with labels(value, de_label, en_label, sort_order) as (
  values
    ('everyday', 'Alltag', 'Everyday', 10),
    ('date', 'Date', 'Date', 20),
    ('travel', 'Reise', 'Travel', 30),
    ('milestone', 'Meilenstein', 'Milestone', 40),
    ('funny', 'Lustig', 'Funny', 50),
    ('special', 'Besonders', 'Special', 60)
)
insert into content_categories (id, content_type, value, label, active, sort_order, updated_at)
select gen_random_uuid(), 'memories', value, de_label, true, sort_order, now()
from labels
on conflict (content_type, value) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  updated_at = now();

with labels(value, locale, label) as (
  values
    ('everyday', 'de', 'Alltag'),
    ('everyday', 'en', 'Everyday'),
    ('date', 'de', 'Date'),
    ('date', 'en', 'Date'),
    ('travel', 'de', 'Reise'),
    ('travel', 'en', 'Travel'),
    ('milestone', 'de', 'Meilenstein'),
    ('milestone', 'en', 'Milestone'),
    ('funny', 'de', 'Lustig'),
    ('funny', 'en', 'Funny'),
    ('special', 'de', 'Besonders'),
    ('special', 'en', 'Special')
)
insert into content_category_translations (category_id, locale, label)
select c.id, labels.locale, labels.label
from labels
join content_categories c on c.content_type = 'memories' and c.value = labels.value
on conflict (category_id, locale) do update
set label = excluded.label;
