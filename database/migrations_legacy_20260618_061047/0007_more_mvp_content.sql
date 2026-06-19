insert into daily_questions (id, text, category, depth_level, long_distance_suitable, active)
values
  ('00000000-0000-0000-0000-000000000104', 'Wann musstest du zuletzt wegen mir laecheln?', 'humor', 1, true, true),
  ('00000000-0000-0000-0000-000000000105', 'Welche Erinnerung mit uns wuerdest du gern nochmal erleben?', 'memory', 2, true, true),
  ('00000000-0000-0000-0000-000000000106', 'Was gibt dir in unserer Beziehung Sicherheit?', 'trust', 2, true, true),
  ('00000000-0000-0000-0000-000000000107', 'Was liebst du an unserem Alltag?', 'everyday', 1, false, true),
  ('00000000-0000-0000-0000-000000000108', 'Was ist ein Traum, den wir irgendwann gemeinsam erfuellen koennten?', 'future', 3, true, true),
  ('00000000-0000-0000-0000-000000000109', 'Welche Eigenschaft an mir bewunderst du gerade besonders?', 'gratitude', 2, true, true),
  ('00000000-0000-0000-0000-000000000110', 'Was kann ich tun, damit du dich diese Woche unterstuetzt fuehlst?', 'support', 3, true, true),
  ('00000000-0000-0000-0000-000000000111', 'Welche kleine gemeinsame Tradition moechtest du pflegen?', 'ritual', 2, true, true),
  ('00000000-0000-0000-0000-000000000112', 'Was war heute ein kleiner guter Moment?', 'everyday', 1, true, true),
  ('00000000-0000-0000-0000-000000000113', 'Welcher Ort fuehlt sich fuer uns beide nach Ruhe an?', 'connection', 2, true, true)
on conflict (id) do nothing;

insert into quests (id, title, description, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners)
values
  ('00000000-0000-0000-0000-000000000204', 'Mini-Date zu Hause', 'Legt Musik auf, macht euch ein Getraenk und schenkt euch 20 Minuten ohne Ablenkung.', 'date', 20, 'low', 15, 'date_seed', true),
  ('00000000-0000-0000-0000-000000000205', 'Dank fuer etwas Konkretes', 'Sagt euch jeweils eine Sache, fuer die ihr heute dankbar seid.', 'romance', 5, 'low', 10, 'compliment_seed', true),
  ('00000000-0000-0000-0000-000000000206', 'Alte Fotos ansehen', 'Sucht gemeinsam drei Fotos aus, die euch an eine schoene Zeit erinnern.', 'memory', 15, 'low', 15, 'memory_seed', true),
  ('00000000-0000-0000-0000-000000000207', '10-Minuten-Teamwork', 'Erledigt gemeinsam eine kleine Alltagsaufgabe und macht sie euch leicht.', 'teamwork', 10, 'low', 10, 'team_seed', true),
  ('00000000-0000-0000-0000-000000000208', 'Ein Song gleichzeitig', 'Startet zur gleichen Zeit denselben Song und schreibt euch eine Zeile dazu.', 'long_distance', 5, 'low', 10, 'light_seed', false),
  ('00000000-0000-0000-0000-000000000209', 'Zukunftswunsch', 'Schreibt je einen kleinen Wunsch auf, den ihr irgendwann gemeinsam erleben wollt.', 'memory', 10, 'low', 15, 'future_seed', true),
  ('00000000-0000-0000-0000-000000000210', 'Insider-Witz sammeln', 'Erinnert euch an einen Insider-Witz und gebt ihm einen Namen.', 'humor', 5, 'low', 10, 'humor_seed', true),
  ('00000000-0000-0000-0000-000000000211', 'Stress kurz teilen', 'Nennt je eine Sache, die gerade anstrengend ist, und eine kleine Hilfe.', 'teamwork', 15, 'medium', 20, 'support_seed', true)
on conflict (id) do nothing;

