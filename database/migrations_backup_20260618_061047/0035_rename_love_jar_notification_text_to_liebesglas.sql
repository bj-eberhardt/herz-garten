update message_template_translations
set text = '{name} hat etwas in euer Liebesglas gelegt.',
    updated_at = now()
where locale = 'de'
  and template_key = 'notifications.bodies.loveJarNote'
  and text = '{name} hat etwas in euren Love Jar gelegt.';
