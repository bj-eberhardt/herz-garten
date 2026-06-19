alter table garden_objects
  drop constraint if exists garden_objects_area_key_check;

alter table garden_levels
  add column if not exists area_key text,
  add column if not exists background_image text,
  add column if not exists accent text;

with defaults(stage, area_key, background_image, accent) as (
  values
    (1, 'heart_bed', '/garden-backgrounds/heart-bed.png', '#f08a82'),
    (2, 'flower_meadow', '/garden-backgrounds/flower-meadow.png', '#e7a86f'),
    (3, 'bench_grove', '/garden-backgrounds/bench-grove.png', '#8fb66b'),
    (4, 'memory_tree', '/garden-backgrounds/memory-tree-area.png', '#7ca37b'),
    (5, 'light_meadow', '/garden-backgrounds/light-meadow.png', '#e9bd62'),
    (6, 'pond', '/garden-backgrounds/pond-area.png', '#6fb5c7'),
    (7, 'picnic', '/garden-backgrounds/picnic-area.png', '#d87964'),
    (8, 'star_meadow', '/garden-backgrounds/star-meadow.png', '#727bb9'),
    (9, 'wishing_well', '/garden-backgrounds/wishing-well-area.png', '#8b90a8'),
    (10, 'garden_fest', '/garden-backgrounds/garden-fest.png', '#d89d52')
)
update garden_levels gl
set
  area_key = coalesce(gl.area_key, defaults.area_key),
  background_image = coalesce(gl.background_image, defaults.background_image),
  accent = coalesce(gl.accent, defaults.accent)
from defaults
where gl.stage = defaults.stage;

update garden_levels
set
  area_key = coalesce(area_key, 'level_' || replace(id::text, '-', '_')),
  background_image = coalesce(background_image, '/garden-backgrounds/heart-bed.png'),
  accent = coalesce(accent, '#8fb66b');

alter table garden_levels
  alter column area_key set not null,
  alter column background_image set not null,
  alter column accent set not null;

create unique index if not exists garden_levels_area_key_idx on garden_levels (area_key);

create table if not exists garden_assets (
  key text primary key,
  label text not null,
  object_type text not null check (object_type in ('flower', 'tree', 'bench', 'light', 'stone', 'pond', 'decoration')),
  source_types text[] not null default '{}',
  stage_unlock integer not null check (stage_unlock >= 1),
  image text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  anchor_x numeric(4, 3) not null check (anchor_x >= 0 and anchor_x <= 1),
  anchor_y numeric(4, 3) not null check (anchor_y >= 0 and anchor_y <= 1),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

with assets(key, label, object_type, source_types, stage_unlock, image, width, height, anchor_x, anchor_y, sort_order) as (
  values
    ('conversation_flower', 'Gespraechsblume', 'flower', array['question'], 1, '/garden-assets/conversation-flower.png', 86, 108, 0.5, 0.9, 10),
    ('heart_flower', 'Herzblume', 'flower', array['know_me', 'quest'], 2, '/garden-assets/heart-flower.png', 92, 112, 0.5, 0.9, 20),
    ('memory_tree', 'Erinnerungsbaum', 'tree', array['quest', 'milestone'], 4, '/garden-assets/memory-tree.png', 150, 178, 0.5, 0.94, 30),
    ('memory_stone', 'Erinnerungsstein', 'stone', array['memory', 'quest'], 4, '/garden-assets/memory-stone.png', 108, 82, 0.5, 0.82, 40),
    ('warm_lantern', 'Liebesglas-Licht', 'light', array['love_jar', 'quest'], 5, '/garden-assets/warm-lantern.png', 76, 118, 0.5, 0.92, 50),
    ('couple_bench', 'Paarbank', 'bench', array['milestone'], 3, '/garden-assets/couple-bench.png', 148, 100, 0.5, 0.84, 60),
    ('quiet_pond', 'Teich der Ruhe', 'pond', array['milestone'], 6, '/garden-assets/quiet-pond.png', 190, 112, 0.5, 0.78, 70),
    ('picnic_blanket', 'Picknickdecke', 'decoration', array['quest'], 7, '/garden-assets/picnic-blanket.png', 148, 96, 0.5, 0.78, 80),
    ('wishing_well', 'Wunschbrunnen', 'decoration', array['milestone'], 9, '/garden-assets/wishing-well.png', 128, 152, 0.5, 0.9, 90),
    ('date_pavilion', 'Date-Pavillon', 'decoration', array['quest'], 10, '/garden-assets/date-pavilion.png', 174, 154, 0.5, 0.92, 100),
    ('distance_bridge', 'Fernbeziehungs-Bruecke', 'decoration', array['quest'], 8, '/garden-assets/distance-bridge.png', 184, 112, 0.5, 0.82, 110),
    ('polaroid_frame', 'Polaroid-Ort', 'decoration', array['memory'], 4, '/garden-assets/polaroid-frame.png', 94, 118, 0.5, 0.9, 120),
    ('garden_decor', 'Gartendeko', 'decoration', array['quest', 'milestone'], 1, '/garden-assets/garden-decor.png', 92, 94, 0.5, 0.86, 130)
)
insert into garden_assets (
  key, label, object_type, source_types, stage_unlock, image, width, height, anchor_x, anchor_y, sort_order
)
select key, label, object_type, source_types, stage_unlock, image, width, height, anchor_x, anchor_y, sort_order
from assets
on conflict (key) do update set
  label = excluded.label,
  object_type = excluded.object_type,
  source_types = excluded.source_types,
  stage_unlock = excluded.stage_unlock,
  image = excluded.image,
  width = excluded.width,
  height = excluded.height,
  anchor_x = excluded.anchor_x,
  anchor_y = excluded.anchor_y,
  sort_order = excluded.sort_order,
  updated_at = now();
