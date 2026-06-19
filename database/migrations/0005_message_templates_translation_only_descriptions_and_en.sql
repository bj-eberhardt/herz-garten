-- Message templates are translation-only as well: notification text and the
-- admin-facing description live in message_template_translations.

alter table public.message_template_translations
  add column if not exists description text;

update public.message_template_translations translation
set description = template.description
from public.message_templates template
where translation.template_key = template.key
  and translation.locale = 'de'
  and (translation.description is null or translation.description = '');

insert into public.message_template_translations (template_key, locale, text, description)
values
  ('notifications.titles.dailyAnswerWaiting', 'en', 'Answer waiting', 'Notification title: answer waiting'),
  ('notifications.titles.dailyRevealed', 'en', 'Your answers are visible', 'Notification title: daily question revealed'),
  ('notifications.titles.questWaitingConfirmation', 'en', 'Quest waiting for you', 'Notification title: quest awaiting confirmation'),
  ('notifications.titles.questCompleted', 'en', 'Quest completed', 'Notification title: quest completed'),
  ('notifications.titles.loveJarNote', 'en', 'A new note is waiting', 'Notification title: love jar note'),
  ('notifications.titles.memoryCreated', 'en', 'New memory', 'Notification title: memory created'),
  ('notifications.titles.knowMeQuestion', 'en', 'A Know Me question is waiting', 'Notification title: Know Me question'),
  ('notifications.titles.knowMeAnsweredHit', 'en', 'Hit in the Know Me game', 'Notification title: Know Me guessed correctly'),
  ('notifications.titles.knowMeAnsweredMiss', 'en', 'An answer is in', 'Notification title: Know Me guessed incorrectly'),
  ('notifications.titles.coupleDisconnected', 'en', 'Pairing was disconnected', 'Notification title: pairing disconnected'),
  ('notifications.titles.coupleJoined', 'en', 'Your partner is here', 'Notification title: partner joined'),
  ('notifications.bodies.dailyAnswerWaiting', 'en', '{name} answered the daily question. Now it is your turn.', 'Notification body: answer waiting'),
  ('notifications.bodies.dailyRevealed', 'en', 'You both answered. A new flower has grown.', 'Notification body: daily question revealed'),
  ('notifications.bodies.questWaitingConfirmation', 'en', '{name} confirmed "{title}". If it works for you too, you can complete it.', 'Notification body: quest awaiting confirmation'),
  ('notifications.bodies.questCompleted', 'en', 'Your quest "{title}" helped your garden grow.', 'Notification body: quest completed'),
  ('notifications.bodies.loveJarNote', 'en', '{name} put something in your love jar.', 'Notification body: love jar note'),
  ('notifications.bodies.memoryCreated', 'en', '{name} added "{title}" to your timeline.', 'Notification body: memory created'),
  ('notifications.bodies.knowMeQuestion', 'en', '{name} asked a question about themselves. What is your guess?', 'Notification body: Know Me question'),
  ('notifications.bodies.knowMeAnsweredHit', 'en', '{name} guessed you correctly. A special flower has grown.', 'Notification body: Know Me guessed correctly'),
  ('notifications.bodies.knowMeAnsweredMiss', 'en', '{name} guessed. Not a hit, but a new conversation starter.', 'Notification body: Know Me guessed incorrectly'),
  ('notifications.bodies.coupleDisconnected', 'en', '{name} deleted the account. Your pairing was disconnected because of that. You can pair again now.', 'Notification body: pairing disconnected'),
  ('notifications.bodies.coupleJoined', 'en', 'Great, {name} joined your couple space. You can now work on your garden together.', 'Notification body: partner joined')
on conflict (template_key, locale) do update set
  text = case
    when public.message_template_translations.text is null or public.message_template_translations.text = ''
      then excluded.text
    else public.message_template_translations.text
  end,
  description = case
    when public.message_template_translations.description is null or public.message_template_translations.description = ''
      then excluded.description
    else public.message_template_translations.description
  end,
  updated_at = now();

update public.message_template_translations
set description = template_key
where description is null or description = '';

alter table public.message_template_translations
  alter column description set not null;

alter table public.message_templates
  drop column if exists description;
