create unique index if not exists one_memory_stone_per_entry
  on garden_objects (source_type, source_id)
  where source_type = 'memory' and source_id is not null;

