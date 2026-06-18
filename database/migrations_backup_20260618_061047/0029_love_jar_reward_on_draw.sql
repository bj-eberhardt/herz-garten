with removed_lights as (
  delete from garden_objects go
  using love_jar_notes note
  where go.source_type = 'love_jar'
    and go.source_id = note.id
    and note.is_drawn = false
  returning go.couple_id, go.reward_points
),
point_adjustments as (
  select couple_id, coalesce(sum(reward_points), 0)::integer as points_to_remove
  from removed_lights
  group by couple_id
)
update couples c
set heart_points = greatest(0, c.heart_points - point_adjustments.points_to_remove),
    garden_stage = greatest(1, floor(greatest(0, c.heart_points - point_adjustments.points_to_remove) / 200) + 1)
from point_adjustments
where c.id = point_adjustments.couple_id;
