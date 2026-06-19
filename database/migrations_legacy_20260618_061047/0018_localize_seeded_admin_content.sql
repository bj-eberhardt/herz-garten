with labels(content_type, value, de_label, en_label, sort_order) as (
  values
    ('daily-questions', 'connection', 'Verbindung', 'Connection', 10),
    ('daily-questions', 'date', 'Date', 'Date', 20),
    ('daily-questions', 'deep', 'Tiefe Gespraeche', 'Deep conversations', 30),
    ('daily-questions', 'everyday', 'Alltag', 'Everyday life', 40),
    ('daily-questions', 'future', 'Zukunft', 'Future', 50),
    ('daily-questions', 'gratitude', 'Dankbarkeit', 'Gratitude', 60),
    ('daily-questions', 'humor', 'Humor', 'Humor', 70),
    ('daily-questions', 'long_distance', 'Fernbeziehung', 'Long distance', 80),
    ('daily-questions', 'memory', 'Erinnerungen', 'Memories', 90),
    ('daily-questions', 'ritual', 'Rituale', 'Rituals', 100),
    ('daily-questions', 'romance', 'Romantik', 'Romance', 110),
    ('daily-questions', 'support', 'Unterstuetzung', 'Support', 120),
    ('daily-questions', 'teamwork', 'Teamwork', 'Teamwork', 130),
    ('daily-questions', 'trust', 'Vertrauen', 'Trust', 140),
    ('quests', 'date', 'Date', 'Date', 10),
    ('quests', 'humor', 'Humor', 'Humor', 20),
    ('quests', 'long_distance', 'Fernbeziehung', 'Long distance', 30),
    ('quests', 'memory', 'Erinnerungen', 'Memories', 40),
    ('quests', 'romance', 'Romantik', 'Romance', 50),
    ('quests', 'teamwork', 'Teamwork', 'Teamwork', 60),
    ('know-me-catalog', 'Abenteuer', 'Abenteuer', 'Adventure', 10),
    ('know-me-catalog', 'Alltag', 'Alltag', 'Everyday life', 20),
    ('know-me-catalog', 'Date', 'Date', 'Date', 30),
    ('know-me-catalog', 'Erinnerung', 'Erinnerung', 'Memory', 40),
    ('know-me-catalog', 'Freizeit', 'Freizeit', 'Free time', 50),
    ('know-me-catalog', 'Humor', 'Humor', 'Humor', 60),
    ('know-me-catalog', 'Musik', 'Musik', 'Music', 70),
    ('know-me-catalog', 'Nahe', 'Naehe', 'Closeness', 80),
    ('know-me-catalog', 'Reise', 'Reise', 'Travel', 90),
    ('know-me-catalog', 'Ritual', 'Ritual', 'Ritual', 100),
    ('know-me-catalog', 'Ruhe', 'Ruhe', 'Calm', 110),
    ('know-me-catalog', 'Stress', 'Stress', 'Stress', 120),
    ('know-me-catalog', 'Support', 'Unterstuetzung', 'Support', 130),
    ('know-me-catalog', 'Tiefe', 'Tiefe', 'Depth', 140),
    ('know-me-catalog', 'Ueberraschung', 'Ueberraschung', 'Surprise', 150),
    ('know-me-catalog', 'Verbindung', 'Verbindung', 'Connection', 160),
    ('know-me-catalog', 'Vorlieben', 'Vorlieben', 'Preferences', 170),
    ('know-me-catalog', 'Zukunft', 'Zukunft', 'Future', 180),
    ('know-me-catalog', 'Zuhause', 'Zuhause', 'Home', 190),
    ('love-jar-templates', 'compliment', 'Kompliment', 'Compliment', 10),
    ('love-jar-templates', 'memory', 'Erinnerung', 'Memory', 20),
    ('love-jar-templates', 'surprise', 'Ueberraschung', 'Surprise', 30),
    ('love-jar-templates', 'voucher', 'Gutschein', 'Voucher', 40),
    ('love-jar-templates', 'wish', 'Wunsch', 'Wish', 50)
)
insert into content_categories (id, content_type, value, label, active, sort_order, updated_at)
select gen_random_uuid(), content_type, value, de_label, true, sort_order, now()
from labels
on conflict (content_type, value) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  updated_at = now();

with labels(content_type, value, locale, label) as (
  values
    ('daily-questions', 'connection', 'de', 'Verbindung'),
    ('daily-questions', 'connection', 'en', 'Connection'),
    ('daily-questions', 'date', 'de', 'Date'),
    ('daily-questions', 'date', 'en', 'Date'),
    ('daily-questions', 'deep', 'de', 'Tiefe Gespraeche'),
    ('daily-questions', 'deep', 'en', 'Deep conversations'),
    ('daily-questions', 'everyday', 'de', 'Alltag'),
    ('daily-questions', 'everyday', 'en', 'Everyday life'),
    ('daily-questions', 'future', 'de', 'Zukunft'),
    ('daily-questions', 'future', 'en', 'Future'),
    ('daily-questions', 'gratitude', 'de', 'Dankbarkeit'),
    ('daily-questions', 'gratitude', 'en', 'Gratitude'),
    ('daily-questions', 'humor', 'de', 'Humor'),
    ('daily-questions', 'humor', 'en', 'Humor'),
    ('daily-questions', 'long_distance', 'de', 'Fernbeziehung'),
    ('daily-questions', 'long_distance', 'en', 'Long distance'),
    ('daily-questions', 'memory', 'de', 'Erinnerungen'),
    ('daily-questions', 'memory', 'en', 'Memories'),
    ('daily-questions', 'ritual', 'de', 'Rituale'),
    ('daily-questions', 'ritual', 'en', 'Rituals'),
    ('daily-questions', 'romance', 'de', 'Romantik'),
    ('daily-questions', 'romance', 'en', 'Romance'),
    ('daily-questions', 'support', 'de', 'Unterstuetzung'),
    ('daily-questions', 'support', 'en', 'Support'),
    ('daily-questions', 'teamwork', 'de', 'Teamwork'),
    ('daily-questions', 'teamwork', 'en', 'Teamwork'),
    ('daily-questions', 'trust', 'de', 'Vertrauen'),
    ('daily-questions', 'trust', 'en', 'Trust'),
    ('quests', 'date', 'de', 'Date'),
    ('quests', 'date', 'en', 'Date'),
    ('quests', 'humor', 'de', 'Humor'),
    ('quests', 'humor', 'en', 'Humor'),
    ('quests', 'long_distance', 'de', 'Fernbeziehung'),
    ('quests', 'long_distance', 'en', 'Long distance'),
    ('quests', 'memory', 'de', 'Erinnerungen'),
    ('quests', 'memory', 'en', 'Memories'),
    ('quests', 'romance', 'de', 'Romantik'),
    ('quests', 'romance', 'en', 'Romance'),
    ('quests', 'teamwork', 'de', 'Teamwork'),
    ('quests', 'teamwork', 'en', 'Teamwork'),
    ('love-jar-templates', 'compliment', 'de', 'Kompliment'),
    ('love-jar-templates', 'compliment', 'en', 'Compliment'),
    ('love-jar-templates', 'memory', 'de', 'Erinnerung'),
    ('love-jar-templates', 'memory', 'en', 'Memory'),
    ('love-jar-templates', 'surprise', 'de', 'Ueberraschung'),
    ('love-jar-templates', 'surprise', 'en', 'Surprise'),
    ('love-jar-templates', 'voucher', 'de', 'Gutschein'),
    ('love-jar-templates', 'voucher', 'en', 'Voucher'),
    ('love-jar-templates', 'wish', 'de', 'Wunsch'),
    ('love-jar-templates', 'wish', 'en', 'Wish')
)
insert into content_category_translations (category_id, locale, label)
select c.id, labels.locale, labels.label
from labels
join content_categories c on c.content_type = labels.content_type and c.value = labels.value
on conflict (category_id, locale) do update
set label = excluded.label;

with know_me_labels(value, de_label, en_label) as (
  values
    ('Abenteuer', 'Abenteuer', 'Adventure'),
    ('Alltag', 'Alltag', 'Everyday life'),
    ('Date', 'Date', 'Date'),
    ('Erinnerung', 'Erinnerung', 'Memory'),
    ('Freizeit', 'Freizeit', 'Free time'),
    ('Humor', 'Humor', 'Humor'),
    ('Musik', 'Musik', 'Music'),
    ('Nahe', 'Naehe', 'Closeness'),
    ('Reise', 'Reise', 'Travel'),
    ('Ritual', 'Ritual', 'Ritual'),
    ('Ruhe', 'Ruhe', 'Calm'),
    ('Stress', 'Stress', 'Stress'),
    ('Support', 'Unterstuetzung', 'Support'),
    ('Tiefe', 'Tiefe', 'Depth'),
    ('Ueberraschung', 'Ueberraschung', 'Surprise'),
    ('Verbindung', 'Verbindung', 'Connection'),
    ('Vorlieben', 'Vorlieben', 'Preferences'),
    ('Zukunft', 'Zukunft', 'Future'),
    ('Zuhause', 'Zuhause', 'Home')
),
expanded as (
  select value, 'de' as locale, de_label as label from know_me_labels
  union all
  select value, 'en' as locale, en_label as label from know_me_labels
)
insert into content_category_translations (category_id, locale, label)
select c.id, expanded.locale, expanded.label
from expanded
join content_categories c on c.content_type = 'know-me-catalog' and c.value = expanded.value
on conflict (category_id, locale) do update
set label = excluded.label;

insert into love_jar_template_translations (template_id, locale, text)
values
  ('00000000-0000-0000-0000-000000001601', 'en', 'What I love about you is ...'),
  ('00000000-0000-0000-0000-000000001602', 'en', 'Thank you for ...'),
  ('00000000-0000-0000-0000-000000001603', 'en', 'My favorite moment with you was ...'),
  ('00000000-0000-0000-0000-000000001604', 'en', 'I am looking forward to ... with you'),
  ('00000000-0000-0000-0000-000000001605', 'en', 'Voucher for ...'),
  ('00000000-0000-0000-0000-000000001606', 'en', 'Today I want to tell you ...'),
  ('00000000-0000-0000-0000-000000001607', 'en', 'You made my day easier because ...'),
  ('00000000-0000-0000-0000-000000001608', 'en', 'I thought of you when ...'),
  ('00000000-0000-0000-0000-000000001609', 'en', 'One small thing I admire about you is ...'),
  ('00000000-0000-0000-0000-000000001610', 'en', 'When we have time soon, I wish for ...'),
  ('00000000-0000-0000-0000-000000001611', 'en', 'My heart moment of the week with you was ...'),
  ('00000000-0000-0000-0000-000000001612', 'en', 'I feel close to you when ...'),
  ('00000000-0000-0000-0000-000000001613', 'en', 'A memory I would love to repeat is ...'),
  ('00000000-0000-0000-0000-000000001614', 'en', 'I am proud of us because ...'),
  ('00000000-0000-0000-0000-000000001615', 'en', 'Voucher for a phone-free evening: ...'),
  ('00000000-0000-0000-0000-000000001616', 'en', 'Today I am giving you this thought: ...'),
  ('00000000-0000-0000-0000-000000001617', 'en', 'What you may not hear often enough: ...'),
  ('00000000-0000-0000-0000-000000001618', 'en', 'I am looking forward to our next ...'),
  ('00000000-0000-0000-0000-000000001619', 'en', 'A small promise for this week: ...'),
  ('00000000-0000-0000-0000-000000001620', 'en', 'You make me smile when ...'),
  ('00000000-0000-0000-0000-000000001621', 'en', 'I want to show you again soon that ...'),
  ('00000000-0000-0000-0000-000000001622', 'en', 'A wish for both of us: ...'),
  ('00000000-0000-0000-0000-000000001623', 'en', 'Thank you for your patience with ...'),
  ('00000000-0000-0000-0000-000000001624', 'en', 'I feel safe with you when ...'),
  ('00000000-0000-0000-0000-000000001625', 'en', 'A mini date I would like with you: ...'),
  ('00000000-0000-0000-0000-000000001626', 'en', 'What I love about our everyday life: ...')
on conflict (template_id, locale) do update
set text = excluded.text;

insert into daily_question_translations (question_id, locale, text)
values
  ('00000000-0000-0000-0000-000000000104', 'en', 'When did you last smile because of me?'),
  ('00000000-0000-0000-0000-000000000105', 'en', 'Which memory with us would you like to experience again?'),
  ('00000000-0000-0000-0000-000000000106', 'en', 'What gives you a sense of safety in our relationship?'),
  ('00000000-0000-0000-0000-000000000107', 'en', 'What do you love about our everyday life?'),
  ('00000000-0000-0000-0000-000000000108', 'en', 'What is a dream we could fulfill together someday?'),
  ('00000000-0000-0000-0000-000000000109', 'en', 'Which quality in me do you especially admire right now?'),
  ('00000000-0000-0000-0000-000000000110', 'en', 'What can I do so you feel supported this week?'),
  ('00000000-0000-0000-0000-000000000111', 'en', 'Which small shared tradition would you like to keep?'),
  ('00000000-0000-0000-0000-000000000112', 'en', 'What was a small good moment today?'),
  ('00000000-0000-0000-0000-000000000113', 'en', 'Which place feels calm for both of us?'),
  ('00000000-0000-0000-0000-000000000114', 'en', 'Which small gesture from me stays in your heart?'),
  ('00000000-0000-0000-0000-000000000115', 'en', 'What made you smile this week?'),
  ('00000000-0000-0000-0000-000000000116', 'en', 'Which shared moment has felt easy lately?'),
  ('00000000-0000-0000-0000-000000000117', 'en', 'What would you like to thank me for today?'),
  ('00000000-0000-0000-0000-000000000118', 'en', 'What small thing could make our everyday life nicer right now?'),
  ('00000000-0000-0000-0000-000000000119', 'en', 'What do you wish for our next quiet conversation?'),
  ('00000000-0000-0000-0000-000000000120', 'en', 'When do you feel close to me even from afar?'),
  ('00000000-0000-0000-0000-000000000121', 'en', 'Which memory would you like to repeat as a small ritual?'),
  ('00000000-0000-0000-0000-000000000122', 'en', 'What gives you confidence in us right now?'),
  ('00000000-0000-0000-0000-000000000123', 'en', 'Which quality do you like about us as a team?'),
  ('00000000-0000-0000-0000-000000000124', 'en', 'What should we do again soon just for us?'),
  ('00000000-0000-0000-0000-000000000125', 'en', 'Which loving message would you have liked to hear today?'),
  ('00000000-0000-0000-0000-000000000126', 'en', 'What was a small moment when you felt understood?'),
  ('00000000-0000-0000-0000-000000000127', 'en', 'What silly thing should we do together again?'),
  ('00000000-0000-0000-0000-000000000128', 'en', 'What could I do to make your day easier tomorrow?'),
  ('00000000-0000-0000-0000-000000000129', 'en', 'Which thought about our future feels warm?'),
  ('00000000-0000-0000-0000-000000000130', 'en', 'Which boundary or pause would be good for you right now?'),
  ('00000000-0000-0000-0000-000000000131', 'en', 'Which shared strength do we sometimes forget?'),
  ('00000000-0000-0000-0000-000000000132', 'en', 'What would you like to celebrate about our home or everyday life?'),
  ('00000000-0000-0000-0000-000000000133', 'en', 'What is something about me that makes you proud?'),
  ('00000000-0000-0000-0000-000000000134', 'en', 'What would be a nice mini date for the next few days?'),
  ('00000000-0000-0000-0000-000000000135', 'en', 'Which longing would you like to gently explain to me?'),
  ('00000000-0000-0000-0000-000000000136', 'en', 'Which memory shows well who we are as a couple?'),
  ('00000000-0000-0000-0000-000000000137', 'en', 'Where do you feel best supported by me?'),
  ('00000000-0000-0000-0000-000000000138', 'en', 'Which small tradition fits our current phase of life?'),
  ('00000000-0000-0000-0000-000000000139', 'en', 'What should we allow each other more often?'),
  ('00000000-0000-0000-0000-000000000140', 'en', 'What was a moment when you felt safe with me?'),
  ('00000000-0000-0000-0000-000000000141', 'en', 'Which small surprise would make you happy right now?'),
  ('00000000-0000-0000-0000-000000000142', 'en', 'Which question have you wanted to ask me for a long time?'),
  ('00000000-0000-0000-0000-000000000143', 'en', 'What makes our connection noticeable even on busy days?')
on conflict (question_id, locale) do update
set text = excluded.text;

insert into quest_translations (quest_id, locale, title, description)
values
  ('00000000-0000-0000-0000-000000000204', 'en', 'Mini Date at Home', 'Put on music, make yourselves a drink, and give each other 20 minutes without distractions.'),
  ('00000000-0000-0000-0000-000000000205', 'en', 'Thanks for Something Specific', 'Each tell the other one specific thing you are grateful for today.'),
  ('00000000-0000-0000-0000-000000000206', 'en', 'Look at Old Photos', 'Choose three photos together that remind you of a beautiful time.'),
  ('00000000-0000-0000-0000-000000000207', 'en', '10-Minute Teamwork', 'Do a small everyday task together and make it feel easy.'),
  ('00000000-0000-0000-0000-000000000208', 'en', 'One Song at the Same Time', 'Start the same song at the same time and send each other one line about it.'),
  ('00000000-0000-0000-0000-000000000209', 'en', 'Future Wish', 'Each write down one small wish you want to experience together someday.'),
  ('00000000-0000-0000-0000-000000000210', 'en', 'Collect an Inside Joke', 'Remember an inside joke and give it a name.'),
  ('00000000-0000-0000-0000-000000000211', 'en', 'Share Stress Briefly', 'Each name one thing that feels hard right now and one small thing that would help.'),
  ('00000000-0000-0000-0000-000000000212', 'en', 'Two-Minute Thanks', 'Take turns naming one specific thing you are grateful for today.'),
  ('00000000-0000-0000-0000-000000000213', 'en', 'Favorite Snack Date', 'Get or prepare a favorite snack and give each other 15 minutes without distractions.'),
  ('00000000-0000-0000-0000-000000000214', 'en', 'Inside Word', 'Invent a new word for something only the two of you understand.'),
  ('00000000-0000-0000-0000-000000000215', 'en', 'Photo Flashback', 'Choose an old photo and tell each other what you like about it.'),
  ('00000000-0000-0000-0000-000000000216', 'en', 'Small Help', 'Take over one small task that gives the other person some breathing room today.'),
  ('00000000-0000-0000-0000-000000000217', 'en', 'Same Song', 'Listen to the same song at the same time and write each other one sentence afterward.'),
  ('00000000-0000-0000-0000-000000000218', 'en', 'Future Note', 'Both write down one wish for this year and read it to each other.'),
  ('00000000-0000-0000-0000-000000000219', 'en', 'Walk with a Question', 'Go for a walk and bring along a question that is not about logistics.'),
  ('00000000-0000-0000-0000-000000000220', 'en', 'Stress Traffic Light', 'Name red, yellow, and green for your current week: hard, mixed, good.'),
  ('00000000-0000-0000-0000-000000000221', 'en', 'Compliment by Voice Message', 'Send a short voice message with an honest compliment.'),
  ('00000000-0000-0000-0000-000000000222', 'en', 'Living Room Picnic', 'Spread out a blanket and turn an ordinary meal into a small picnic.'),
  ('00000000-0000-0000-0000-000000000223', 'en', 'Three Good Things', 'Name three things that are going well in your relationship right now.'),
  ('00000000-0000-0000-0000-000000000224', 'en', 'Silly Selfie', 'Take an intentionally silly couple selfie or describe one from afar.'),
  ('00000000-0000-0000-0000-000000000225', 'en', 'Next Reunion', 'Plan one small concrete detail for your next reunion.'),
  ('00000000-0000-0000-0000-000000000226', 'en', 'Thanks to Earlier Us', 'Remember a hard phase and say what you managed to get through.'),
  ('00000000-0000-0000-0000-000000000227', 'en', 'Mini Cleanup Team', 'Do a 10-minute cleanup sprint together with music.'),
  ('00000000-0000-0000-0000-000000000228', 'en', 'Surprise Under 5 Euros', 'Plan a small surprise that does not have to cost much.'),
  ('00000000-0000-0000-0000-000000000229', 'en', 'Bright Moments List', 'Write down three moments that feel like the two of you.'),
  ('00000000-0000-0000-0000-000000000230', 'en', 'Phone-Free Island', 'Put both phones away for 30 minutes and do something simple together.'),
  ('00000000-0000-0000-0000-000000000231', 'en', 'Who Would Rather', 'Play ten quick who-would-rather questions, lovingly and without jabs.')
on conflict (quest_id, locale) do update
set
  title = excluded.title,
  description = excluded.description;
