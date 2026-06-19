update content_categories
set relationship_modes = '{}',
    content_styles = '{}'
where content_type = 'know-me-catalog';

update content_categories
set relationship_modes = array['mixed'],
    content_styles = array['balanced']
where content_type = 'know-me-catalog'
  and value in ('Alltag', 'Vorlieben', 'Nahe', 'Verbindung', 'Ritual', 'Freizeit', 'Zuhause', 'Support', 'Ruhe');

update content_categories
set relationship_modes = array['local', 'mixed'],
    content_styles = array['balanced', 'romantic', 'playful']
where content_type = 'know-me-catalog'
  and value in ('Date', 'Ueberraschung');

update content_categories
set relationship_modes = array['long_distance', 'mixed'],
    content_styles = array['balanced', 'deep']
where content_type = 'know-me-catalog'
  and value in ('Musik', 'Reise', 'Erinnerung', 'Zukunft');

update content_categories
set content_styles = array['playful']
where content_type = 'know-me-catalog'
  and value in ('Humor', 'Abenteuer');

update content_categories
set content_styles = array['deep']
where content_type = 'know-me-catalog'
  and value in ('Tiefe', 'Stress');
