alter table couple_quests
  add column if not exists reward_applied_at timestamptz;

create unique index if not exists one_couple_quest_per_quest
  on couple_quests (couple_id, quest_id);

create unique index if not exists one_quest_reward_object_per_couple_quest
  on garden_objects (source_type, source_id)
  where source_type = 'quest' and source_id is not null;

