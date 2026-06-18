alter table garden_objects
  drop constraint if exists garden_objects_area_key_check;

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
