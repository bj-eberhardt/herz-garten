alter table notifications
  drop constraint if exists notifications_type_check,
  add constraint notifications_type_check check (
    type in (
      'daily_answer_waiting',
      'daily_revealed',
      'quest_waiting_confirmation',
      'quest_completed',
      'love_jar_note',
      'memory_created',
      'know_me_question',
      'know_me_answered',
      'couple_disconnected',
      'couple_joined'
    )
  );

with templates(key, namespace, description, required_params) as (
  values
    ('notifications.titles.coupleJoined', 'notifications', 'Benachrichtigungstitel: Partner beigetreten', '{name}'::text[]),
    ('notifications.bodies.coupleJoined', 'notifications', 'Benachrichtigungstext: Partner beigetreten', '{name}'::text[])
)
insert into message_templates (key, namespace, description, required_params)
select key, namespace, description, required_params
from templates
on conflict (key) do update
set
  namespace = excluded.namespace,
  description = excluded.description,
  required_params = excluded.required_params,
  updated_at = now();

with translations(template_key, locale, text) as (
  values
    ('notifications.titles.coupleJoined', 'de', 'Dein Partner ist da'),
    ('notifications.bodies.coupleJoined', 'de', 'Toll, {name} hat deinen Paarraum betreten. Ihr koennt nun gemeinsam an eurem Garten arbeiten.')
)
insert into message_template_translations (template_key, locale, text)
select template_key, locale, text
from translations
on conflict (template_key, locale) do update
set text = excluded.text;
