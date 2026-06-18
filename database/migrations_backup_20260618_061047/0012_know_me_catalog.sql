create table if not exists know_me_catalog_questions (
  id uuid primary key,
  question_text text not null unique,
  category text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table know_me_questions
  add column if not exists catalog_question_id uuid references know_me_catalog_questions(id) on delete set null;

create index if not exists know_me_catalog_questions_active_sort_idx
  on know_me_catalog_questions (active, sort_order, question_text);

create index if not exists know_me_questions_catalog_author_idx
  on know_me_questions (couple_id, author_id, catalog_question_id)
  where catalog_question_id is not null;

insert into know_me_catalog_questions (id, question_text, category, sort_order)
values
  ('00000000-0000-0000-0000-000000001201', 'Was waere mein perfekter Sonntag?', 'Alltag', 10),
  ('00000000-0000-0000-0000-000000001202', 'Was ist mein heimlicher Lieblingssnack?', 'Vorlieben', 20),
  ('00000000-0000-0000-0000-000000001203', 'Was stresst mich mehr: Unordnung oder Zeitdruck?', 'Stress', 30),
  ('00000000-0000-0000-0000-000000001204', 'Welcher Ort gibt mir Ruhe?', 'Ruhe', 40),
  ('00000000-0000-0000-0000-000000001205', 'Welche kleine Geste bedeutet mir besonders viel?', 'Nahe', 50),
  ('00000000-0000-0000-0000-000000001206', 'Was bringt mich fast immer zum Lachen?', 'Humor', 60),
  ('00000000-0000-0000-0000-000000001207', 'Welches Lied passt gerade am besten zu meiner Stimmung?', 'Musik', 70),
  ('00000000-0000-0000-0000-000000001208', 'Womit kann man mir nach einem langen Tag helfen?', 'Support', 80),
  ('00000000-0000-0000-0000-000000001209', 'Welche Erinnerung mit dir erzaehle ich besonders gern?', 'Erinnerung', 90),
  ('00000000-0000-0000-0000-000000001210', 'Was ist mein Lieblingsritual mit dir?', 'Ritual', 100),
  ('00000000-0000-0000-0000-000000001211', 'Welche Ueberraschung wuerde mich wirklich freuen?', 'Ueberraschung', 110),
  ('00000000-0000-0000-0000-000000001212', 'Was brauche ich, wenn ich still werde?', 'Support', 120),
  ('00000000-0000-0000-0000-000000001213', 'Welche Jahreszeit passt am besten zu mir?', 'Vorlieben', 130),
  ('00000000-0000-0000-0000-000000001214', 'Was wuerde ich auf einer Reise zuerst fotografieren?', 'Reise', 140),
  ('00000000-0000-0000-0000-000000001215', 'Welche Aufgabe schiebe ich am ehesten vor mir her?', 'Alltag', 150),
  ('00000000-0000-0000-0000-000000001216', 'Was macht ein Zuhause fuer mich gemuetlich?', 'Zuhause', 160),
  ('00000000-0000-0000-0000-000000001217', 'Welche Nachricht von dir wuerde meinen Tag sofort besser machen?', 'Nahe', 170),
  ('00000000-0000-0000-0000-000000001218', 'Was ist mein liebster Start in den Morgen?', 'Alltag', 180),
  ('00000000-0000-0000-0000-000000001219', 'Welche Kleinigkeit macht mich schneller ungeduldig?', 'Stress', 190),
  ('00000000-0000-0000-0000-000000001220', 'Welche Date-Idee wuerde ich spontan waehlen?', 'Date', 200),
  ('00000000-0000-0000-0000-000000001221', 'Was wuerde ich an einem freien Abend am liebsten tun?', 'Freizeit', 210),
  ('00000000-0000-0000-0000-000000001222', 'Welche Art Kompliment bleibt mir lange im Kopf?', 'Nahe', 220),
  ('00000000-0000-0000-0000-000000001223', 'Wobei fuehle ich mich besonders verstanden?', 'Verbindung', 230),
  ('00000000-0000-0000-0000-000000001224', 'Was ist fuer mich ein kleines Abenteuer?', 'Abenteuer', 240),
  ('00000000-0000-0000-0000-000000001225', 'Welcher Duft erinnert mich an etwas Schoenes?', 'Erinnerung', 250),
  ('00000000-0000-0000-0000-000000001226', 'Was wuerde ich bestellen, wenn ich mich nicht entscheiden muss?', 'Vorlieben', 260),
  ('00000000-0000-0000-0000-000000001227', 'Welche Gewohnheit von mir kennst du inzwischen gut?', 'Alltag', 270),
  ('00000000-0000-0000-0000-000000001228', 'Welche gemeinsame Zukunftsidee macht mich neugierig?', 'Zukunft', 280),
  ('00000000-0000-0000-0000-000000001229', 'Wann fuehle ich mich dir besonders nah?', 'Nahe', 290),
  ('00000000-0000-0000-0000-000000001230', 'Was hilft mir, wenn ich mich verzettele?', 'Support', 300),
  ('00000000-0000-0000-0000-000000001231', 'Welche Eigenschaft an mir unterschaetze ich selbst?', 'Tiefe', 310),
  ('00000000-0000-0000-0000-000000001232', 'Was ist mein heimlicher Komfortfilm oder meine Komfortserie?', 'Freizeit', 320),
  ('00000000-0000-0000-0000-000000001233', 'Welche kleine Tradition wuerde ich gern mit dir anfangen?', 'Ritual', 330),
  ('00000000-0000-0000-0000-000000001234', 'Was sollte man mir sagen, wenn ich mutiger sein darf?', 'Support', 340),
  ('00000000-0000-0000-0000-000000001235', 'Welche Pause tut mir wirklich gut?', 'Ruhe', 350),
  ('00000000-0000-0000-0000-000000001236', 'Worauf bin ich im Stillen stolz?', 'Tiefe', 360)
on conflict (id) do update
set
  question_text = excluded.question_text,
  category = excluded.category,
  sort_order = excluded.sort_order,
  active = true;
