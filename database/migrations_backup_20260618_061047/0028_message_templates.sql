create table if not exists message_templates (
  key text primary key,
  namespace text not null,
  description text not null default '',
  required_params text[] not null default '{}'::text[],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists message_template_translations (
  template_key text not null references message_templates(key) on delete cascade,
  locale text not null references supported_locales(locale) on delete restrict,
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (template_key, locale)
);

create index if not exists message_templates_namespace_idx
  on message_templates (namespace, key);

with templates(key, namespace, description, required_params) as (
  values
    ('notifications.titles.dailyAnswerWaiting', 'notifications', 'Notification title: daily answer waiting', '{}'::text[]),
    ('notifications.titles.dailyRevealed', 'notifications', 'Notification title: daily answers revealed', '{}'::text[]),
    ('notifications.titles.questWaitingConfirmation', 'notifications', 'Notification title: quest waiting for confirmation', '{}'::text[]),
    ('notifications.titles.questCompleted', 'notifications', 'Notification title: quest completed', '{}'::text[]),
    ('notifications.titles.loveJarNote', 'notifications', 'Notification title: love jar note', '{}'::text[]),
    ('notifications.titles.memoryCreated', 'notifications', 'Notification title: memory created', '{}'::text[]),
    ('notifications.titles.knowMeQuestion', 'notifications', 'Notification title: know me question', '{}'::text[]),
    ('notifications.titles.knowMeAnsweredHit', 'notifications', 'Notification title: know me correct answer', '{}'::text[]),
    ('notifications.titles.knowMeAnsweredMiss', 'notifications', 'Notification title: know me missed answer', '{}'::text[]),
    ('notifications.titles.coupleDisconnected', 'notifications', 'Notification title: couple disconnected', '{}'::text[]),
    ('notifications.bodies.dailyAnswerWaiting', 'notifications', 'Notification body: daily answer waiting', '{name}'::text[]),
    ('notifications.bodies.dailyRevealed', 'notifications', 'Notification body: daily answers revealed', '{}'::text[]),
    ('notifications.bodies.questWaitingConfirmation', 'notifications', 'Notification body: quest waiting for confirmation', '{name,title}'::text[]),
    ('notifications.bodies.questCompleted', 'notifications', 'Notification body: quest completed', '{title}'::text[]),
    ('notifications.bodies.loveJarNote', 'notifications', 'Notification body: love jar note', '{name}'::text[]),
    ('notifications.bodies.memoryCreated', 'notifications', 'Notification body: memory created', '{name,title}'::text[]),
    ('notifications.bodies.knowMeQuestion', 'notifications', 'Notification body: know me question', '{name}'::text[]),
    ('notifications.bodies.knowMeAnsweredHit', 'notifications', 'Notification body: know me correct answer', '{name}'::text[]),
    ('notifications.bodies.knowMeAnsweredMiss', 'notifications', 'Notification body: know me missed answer', '{name}'::text[]),
    ('notifications.bodies.coupleDisconnected', 'notifications', 'Notification body: couple disconnected', '{name}'::text[])
)
insert into message_templates (key, namespace, description, required_params)
select key, namespace, description, required_params
from templates
on conflict (key) do update
set namespace = excluded.namespace,
    description = excluded.description,
    required_params = excluded.required_params,
    active = true,
    updated_at = now();

with translations(template_key, locale, text) as (
  values
    ('notifications.titles.dailyAnswerWaiting', 'de', 'Antwort wartet'),
    ('notifications.titles.dailyRevealed', 'de', 'Eure Antworten sind sichtbar'),
    ('notifications.titles.questWaitingConfirmation', 'de', 'Quest wartet auf dich'),
    ('notifications.titles.questCompleted', 'de', 'Quest abgeschlossen'),
    ('notifications.titles.loveJarNote', 'de', 'Ein neuer Zettel wartet'),
    ('notifications.titles.memoryCreated', 'de', 'Neue Erinnerung'),
    ('notifications.titles.knowMeQuestion', 'de', 'Eine Kennst-du-mich-Frage wartet'),
    ('notifications.titles.knowMeAnsweredHit', 'de', 'Treffer im Kennst-du-mich-Spiel'),
    ('notifications.titles.knowMeAnsweredMiss', 'de', 'Eine Antwort ist da'),
    ('notifications.titles.coupleDisconnected', 'de', 'Paarung wurde getrennt'),
    ('notifications.bodies.dailyAnswerWaiting', 'de', '{name} hat die Tagesfrage beantwortet. Jetzt fehlst noch du.'),
    ('notifications.bodies.dailyRevealed', 'de', 'Ihr habt beide geantwortet. Eine neue Blume ist gewachsen.'),
    ('notifications.bodies.questWaitingConfirmation', 'de', '{name} hat "{title}" bestätigt. Wenn es für dich auch passt, kannst du sie abschließen.'),
    ('notifications.bodies.questCompleted', 'de', 'Eure Quest "{title}" hat euren Garten wachsen lassen.'),
    ('notifications.bodies.loveJarNote', 'de', '{name} hat etwas in euren Love Jar gelegt.'),
    ('notifications.bodies.memoryCreated', 'de', '{name} hat "{title}" in eure Timeline gelegt.'),
    ('notifications.bodies.knowMeQuestion', 'de', '{name} hat eine Frage über sich gestellt. Was schätzt du?'),
    ('notifications.bodies.knowMeAnsweredHit', 'de', '{name} hat dich richtig eingeschätzt. Eine besondere Blume ist gewachsen.'),
    ('notifications.bodies.knowMeAnsweredMiss', 'de', '{name} hat geraten. Nicht getroffen, aber ein neuer Gesprächsanlass.'),
    ('notifications.bodies.coupleDisconnected', 'de', '{name} hat das Konto gelöscht. Eure Paarung wurde deshalb getrennt. Du kannst dich jetzt neu paaren.')
)
insert into message_template_translations (template_key, locale, text)
select template_key, locale, text
from translations
on conflict (template_key, locale) do update
set text = excluded.text,
    updated_at = now();
