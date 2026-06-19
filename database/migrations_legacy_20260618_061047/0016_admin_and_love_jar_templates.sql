create table if not exists admin_audit_log (
  id uuid primary key,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx
  on admin_audit_log (created_at desc);

alter table quests
  add column if not exists active boolean not null default true;

create index if not exists quests_active_category_idx
  on quests (active, category, title);

create table if not exists love_jar_templates (
  id uuid primary key,
  text text not null,
  category text not null default 'compliment' check (category in ('compliment', 'memory', 'voucher', 'wish', 'surprise')),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists love_jar_templates_active_sort_idx
  on love_jar_templates (active, sort_order, text);

create table if not exists love_jar_template_translations (
  template_id uuid not null references love_jar_templates(id) on delete cascade,
  locale text not null references supported_locales(locale) on delete restrict,
  text text not null,
  primary key (template_id, locale)
);

insert into love_jar_templates (id, text, category, sort_order)
values
  ('00000000-0000-0000-0000-000000001601', 'Ich liebe an dir ...', 'compliment', 10),
  ('00000000-0000-0000-0000-000000001602', 'Danke, dass du ...', 'compliment', 20),
  ('00000000-0000-0000-0000-000000001603', 'Mein liebster Moment mit dir war ...', 'memory', 30),
  ('00000000-0000-0000-0000-000000001604', 'Ich freue mich mit dir auf ...', 'wish', 40),
  ('00000000-0000-0000-0000-000000001605', 'Gutschein fuer ...', 'voucher', 50),
  ('00000000-0000-0000-0000-000000001606', 'Heute moechte ich dir sagen ...', 'compliment', 60),
  ('00000000-0000-0000-0000-000000001607', 'Du hast meinen Tag leichter gemacht, weil ...', 'compliment', 70),
  ('00000000-0000-0000-0000-000000001608', 'Ich musste an dich denken, als ...', 'memory', 80),
  ('00000000-0000-0000-0000-000000001609', 'Eine kleine Sache, die ich an dir bewundere, ist ...', 'compliment', 90),
  ('00000000-0000-0000-0000-000000001610', 'Wenn wir bald Zeit haben, wuensche ich mir ...', 'wish', 100),
  ('00000000-0000-0000-0000-000000001611', 'Mein Herzmoment der Woche mit dir war ...', 'memory', 110),
  ('00000000-0000-0000-0000-000000001612', 'Ich fuehle mich dir nah, wenn ...', 'compliment', 120),
  ('00000000-0000-0000-0000-000000001613', 'Eine Erinnerung, die ich gern wiederholen wuerde, ist ...', 'memory', 130),
  ('00000000-0000-0000-0000-000000001614', 'Ich bin stolz auf uns, weil ...', 'compliment', 140),
  ('00000000-0000-0000-0000-000000001615', 'Gutschein fuer einen Abend ohne Handy: ...', 'voucher', 150),
  ('00000000-0000-0000-0000-000000001616', 'Heute schenke ich dir diesen Gedanken: ...', 'surprise', 160),
  ('00000000-0000-0000-0000-000000001617', 'Was du vielleicht zu selten hoerst: ...', 'compliment', 170),
  ('00000000-0000-0000-0000-000000001618', 'Ich freue mich auf unser naechstes ...', 'wish', 180),
  ('00000000-0000-0000-0000-000000001619', 'Ein kleines Versprechen fuer diese Woche: ...', 'surprise', 190),
  ('00000000-0000-0000-0000-000000001620', 'Du bringst mich zum Laecheln, wenn ...', 'compliment', 200),
  ('00000000-0000-0000-0000-000000001621', 'Ich moechte dir bald wieder zeigen, dass ...', 'wish', 210),
  ('00000000-0000-0000-0000-000000001622', 'Ein Wunsch fuer uns beide: ...', 'wish', 220),
  ('00000000-0000-0000-0000-000000001623', 'Danke fuer deine Geduld bei ...', 'compliment', 230),
  ('00000000-0000-0000-0000-000000001624', 'Ich fuehle mich sicher mit dir, wenn ...', 'compliment', 240),
  ('00000000-0000-0000-0000-000000001625', 'Ein Mini-Date, das ich gern mit dir haette: ...', 'wish', 250),
  ('00000000-0000-0000-0000-000000001626', 'Was ich an unserem Alltag liebe: ...', 'compliment', 260)
on conflict (id) do update
set
  text = excluded.text,
  category = excluded.category,
  sort_order = excluded.sort_order;

insert into love_jar_template_translations (template_id, locale, text)
select id, 'de', text
from love_jar_templates
on conflict (template_id, locale) do nothing;
