update message_template_translations
set text = case
  when template_key = 'notifications.titles.questWaitingConfirmation' then 'Aufgabe wartet auf dich'
  when template_key = 'notifications.titles.questCompleted' then 'Aufgabe abgeschlossen'
  when template_key = 'notifications.bodies.questCompleted' then 'Eure Aufgabe "{title}" hat euren Garten wachsen lassen.'
  else text
end
where locale = 'de'
  and (
    (template_key = 'notifications.titles.questWaitingConfirmation' and text = 'Quest wartet auf dich')
    or (template_key = 'notifications.titles.questCompleted' and text = 'Quest abgeschlossen')
    or (template_key = 'notifications.bodies.questCompleted' and text = 'Eure Quest "{title}" hat euren Garten wachsen lassen.')
  );
