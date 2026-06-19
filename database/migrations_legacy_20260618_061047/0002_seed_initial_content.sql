insert into daily_questions (id, text, category, depth_level, long_distance_suitable, active)
values
  ('00000000-0000-0000-0000-000000000101', 'Was war ein Moment, in dem du dich durch mich geliebt gefuehlt hast?', 'gratitude', 2, true, true),
  ('00000000-0000-0000-0000-000000000102', 'Welche kleine Geste von mir bedeutet dir viel?', 'romance', 1, true, true),
  ('00000000-0000-0000-0000-000000000103', 'Was moechtest du bald wieder gemeinsam machen?', 'future', 1, false, true)
on conflict (id) do nothing;

insert into quests (id, title, description, category, estimated_minutes, effort_level, reward_points, reward_seed_type, requires_both_partners)
values
  ('00000000-0000-0000-0000-000000000201', 'Drei Komplimente', 'Schreibt euch gegenseitig drei konkrete Komplimente.', 'romance', 10, 'low', 15, 'compliment_seed', true),
  ('00000000-0000-0000-0000-000000000202', 'Spaziergang ohne Handy', 'Geht gemeinsam spazieren und lasst die Handys in der Tasche.', 'date', 30, 'medium', 20, 'date_seed', true),
  ('00000000-0000-0000-0000-000000000203', 'Aktueller Moment', 'Schickt euch ein Foto von eurem aktuellen Moment.', 'long_distance', 5, 'low', 10, 'light_seed', false)
on conflict (id) do nothing;

