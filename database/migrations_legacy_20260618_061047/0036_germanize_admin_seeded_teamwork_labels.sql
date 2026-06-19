update content_categories
set label = 'Zusammenarbeit'
where value = 'teamwork'
  and label = 'Teamwork';

update content_category_translations translation
set label = 'Zusammenarbeit'
from content_categories category
where translation.category_id = category.id
  and translation.locale = 'de'
  and category.value = 'teamwork'
  and translation.label = 'Teamwork';

update quests
set title = '10-Minuten-Zusammenarbeit'
where id = '00000000-0000-0000-0000-000000000207'
  and title = '10-Minuten-Teamwork';
