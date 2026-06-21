alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check check (
    type = any (
      array[
        'daily_answer_waiting'::text,
        'daily_revealed'::text,
        'quest_waiting_confirmation'::text,
        'quest_completed'::text,
        'love_jar_note'::text,
        'memory_created'::text,
        'know_me_question'::text,
        'know_me_answered'::text,
        'couple_disconnected'::text,
        'couple_joined'::text,
        'admin_password_reset'::text
      ]
    )
  );

insert into public.message_templates (key, namespace, required_params, active, created_at, updated_at)
values
  ('notifications.titles.adminPasswordReset', 'notifications', '{}', true, now(), now()),
  ('notifications.bodies.adminPasswordReset', 'notifications', '{}', true, now(), now()),
  ('push.titles.adminPasswordReset', 'push', '{}', true, now(), now()),
  ('push.bodies.adminPasswordReset', 'push', '{}', true, now(), now()),
  ('emails.adminPasswordReset.subject', 'email', '{}', true, now(), now()),
  ('emails.adminPasswordReset.body', 'email', '{displayName}', true, now(), now())
on conflict (key) do nothing;

insert into public.message_template_translations (template_key, locale, text, description, created_at, updated_at)
values
  (
    'emails.adminPasswordReset.subject',
    'de',
    'Dein Herzgarten-Passwort wurde neu gesetzt',
    'E-Mail-Betreff: Admin hat Passwort neu gesetzt',
    now(),
    now()
  ),
  (
    'emails.adminPasswordReset.body',
    'de',
    'Hallo {displayName},

dein Herzgarten-Passwort wurde durch einen Administrator neu gesetzt.

Wenn du diese Änderung nicht erwartet hast, melde dich bitte sofort beim Support. Aus Sicherheitsgründen enthält diese E-Mail kein Passwort.',
    'E-Mail-Text: Admin hat Passwort neu gesetzt',
    now(),
    now()
  ),
  (
    'notifications.titles.adminPasswordReset',
    'de',
    'Dein Passwort wurde durch einen Administrator neu gesetzt',
    'Benachrichtigungstitel: Admin hat Passwort neu gesetzt',
    now(),
    now()
  ),
  (
    'notifications.bodies.adminPasswordReset',
    'de',
    'Ein Administrator hat dein Passwort neu gesetzt. Wenn du das nicht erwartet hast, melde dich bitte sofort beim Support und ändere dein Passwort erneut.',
    'Benachrichtigungstext: Admin hat Passwort neu gesetzt',
    now(),
    now()
  ),
  (
    'push.titles.adminPasswordReset',
    'de',
    'Passwort durch Admin neu gesetzt',
    'Push-Titel: Admin hat Passwort neu gesetzt',
    now(),
    now()
  ),
  (
    'push.bodies.adminPasswordReset',
    'de',
    'Prüfe dein Konto. Dein Passwort wurde durch einen Administrator geändert.',
    'Push-Text: Admin hat Passwort neu gesetzt',
    now(),
    now()
  ),
  (
    'notifications.titles.adminPasswordReset',
    'en',
    'Your password was reset by an administrator',
    'Notification title: admin reset password',
    now(),
    now()
  ),
  (
    'notifications.bodies.adminPasswordReset',
    'en',
    'An administrator reset your password. If you did not expect this, contact support immediately and change your password again.',
    'Notification body: admin reset password',
    now(),
    now()
  ),
  (
    'push.titles.adminPasswordReset',
    'en',
    'Password reset by admin',
    'Push title: admin reset password',
    now(),
    now()
  ),
  (
    'push.bodies.adminPasswordReset',
    'en',
    'Check your account. Your password was changed by an administrator.',
    'Push body: admin reset password',
    now(),
    now()
  ),
  (
    'emails.adminPasswordReset.subject',
    'en',
    'Your Herzgarten password was reset',
    'Email subject: admin reset password',
    now(),
    now()
  ),
  (
    'emails.adminPasswordReset.body',
    'en',
    'Hello {displayName},

your Herzgarten password was reset by an administrator.

If you did not expect this change, please contact support immediately. For security reasons, this email does not contain a password.',
    'Email body: admin reset password',
    now(),
    now()
  )
on conflict (template_key, locale) do update set
  text = excluded.text,
  description = excluded.description,
  updated_at = now();
