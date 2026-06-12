alter table garden_objects
  add column if not exists reward_points integer not null default 0;

update garden_objects
set reward_points = case
  when source_type = 'question' then 10
  when source_type = 'love_jar' then 5
  when source_type = 'memory' then 8
  when source_type = 'know_me' then 12
  else reward_points
end
where reward_points = 0
  and source_type in ('question', 'love_jar', 'memory', 'know_me');

update garden_objects go
set reward_points = coalesce(q.reward_points, 0)
from couple_quests cq
join quests q on q.id = cq.quest_id
where go.reward_points = 0
  and go.source_type = 'quest'
  and go.source_id = cq.id;

update couples
set garden_stage = greatest(1, floor(heart_points / 200) + 1);

update garden_objects go
set
  area_key = case
    when c.garden_stage >= 10 then 'garden_fest'
    when c.garden_stage >= 9 then 'wishing_well'
    when c.garden_stage >= 8 then 'star_meadow'
    when c.garden_stage >= 7 then 'picnic'
    when c.garden_stage >= 6 then 'pond'
    when c.garden_stage >= 5 then 'light_meadow'
    when c.garden_stage >= 4 then 'memory_tree'
    when c.garden_stage >= 3 then 'bench_grove'
    when c.garden_stage >= 2 then 'flower_meadow'
    else 'heart_bed'
  end,
  placed_by_user = false
from couples c
where go.couple_id = c.id
  and (
    (go.area_key = 'flower_meadow' and c.garden_stage < 2)
    or (go.area_key = 'bench_grove' and c.garden_stage < 3)
    or (go.area_key = 'memory_tree' and c.garden_stage < 4)
    or (go.area_key = 'light_meadow' and c.garden_stage < 5)
    or (go.area_key = 'pond' and c.garden_stage < 6)
    or (go.area_key = 'picnic' and c.garden_stage < 7)
    or (go.area_key = 'star_meadow' and c.garden_stage < 8)
    or (go.area_key = 'wishing_well' and c.garden_stage < 9)
    or (go.area_key = 'garden_fest' and c.garden_stage < 10)
  );
