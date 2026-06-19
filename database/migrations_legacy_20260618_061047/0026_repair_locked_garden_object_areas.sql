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
