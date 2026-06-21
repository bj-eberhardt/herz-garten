update public.garden_levels
set
  points_to_next = case stage
    when 1 then 100
    when 2 then 100
    when 3 then 100
    when 4 then 150
    when 5 then 150
    when 6 then 200
    when 7 then 200
    when 8 then 200
    when 9 then 200
    else points_to_next
  end,
  updated_at = now()
where stage between 1 and 9;
