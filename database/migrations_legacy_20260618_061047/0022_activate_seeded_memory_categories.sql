update content_categories
set active = true,
    updated_at = now()
where content_type = 'memories'
  and value in ('everyday', 'date', 'travel', 'milestone', 'funny', 'special');
