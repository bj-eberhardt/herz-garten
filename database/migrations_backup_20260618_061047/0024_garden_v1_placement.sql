alter table garden_objects
  add column if not exists area_key text not null default 'heart_bed',
  add column if not exists asset_key text not null default 'conversation_flower',
  add column if not exists z_index integer not null default 1,
  add column if not exists scale numeric(4, 2) not null default 1,
  add column if not exists rotation integer not null default 0,
  add column if not exists placed_by_user boolean not null default false;

alter table garden_objects
  add constraint garden_objects_area_key_check
  check (
    area_key in (
      'heart_bed',
      'flower_meadow',
      'bench_grove',
      'memory_tree',
      'light_meadow',
      'pond',
      'picnic',
      'star_meadow',
      'wishing_well',
      'garden_fest'
    )
  );

update garden_objects
set
  area_key = case
    when source_type = 'love_jar' then 'light_meadow'
    when source_type = 'memory' then 'memory_tree'
    when source_type = 'know_me' then 'flower_meadow'
    when type = 'pond' then 'pond'
    when type = 'bench' then 'bench_grove'
    when type = 'tree' then 'memory_tree'
    else 'heart_bed'
  end,
  asset_key = case
    when source_type = 'question' then 'conversation_flower'
    when source_type = 'love_jar' then 'warm_lantern'
    when source_type = 'memory' then 'memory_stone'
    when source_type = 'know_me' then 'heart_flower'
    when type = 'tree' then 'memory_tree'
    when type = 'bench' then 'couple_bench'
    when type = 'pond' then 'quiet_pond'
    when type = 'stone' then 'memory_stone'
    when type = 'light' then 'warm_lantern'
    else 'garden_decor'
  end,
  z_index = 1 + floor(position_y / 10)::int,
  scale = 1,
  rotation = 0,
  placed_by_user = false
where asset_key = 'conversation_flower';

create index if not exists garden_objects_area_created_idx
  on garden_objects (couple_id, area_key, created_at);
