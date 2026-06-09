create unique index if not exists one_love_jar_light_per_note
  on garden_objects (source_type, source_id)
  where source_type = 'love_jar' and source_id is not null;

