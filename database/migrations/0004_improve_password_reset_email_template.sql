update public.message_template_translations
set
  text = 'Passwort für deinen Herzgarten zurücksetzen',
  description = 'E-Mail-Betreff: Passwort zurücksetzen',
  updated_at = now()
where template_key = 'emails.passwordReset.subject'
  and locale = 'de';

update public.message_template_translations
set
  text = $template$
Hallo {displayName},

du hast angefragt, dein Herzgarten-Passwort zurückzusetzen.

Öffne diesen Link, um ein neues Passwort zu vergeben:
{resetUrl}

Der Link ist {expiresInMinutes} Minuten gültig.

Wenn du kein neues Passwort angefordert hast, kannst du diese E-Mail ignorieren.
$template$,
  description = 'E-Mail-Text: Passwort zurücksetzen',
  updated_at = now()
where template_key = 'emails.passwordReset.body'
  and locale = 'de';

update public.message_template_translations
set
  text = 'Reset your Herzgarten password',
  description = 'Email subject: password reset',
  updated_at = now()
where template_key = 'emails.passwordReset.subject'
  and locale = 'en';

update public.message_template_translations
set
  text = $template$
Hello {displayName},

you asked to reset your Herzgarten password.

Open this link to choose a new password:
{resetUrl}

The link is valid for {expiresInMinutes} minutes.

If you did not request a new password, you can ignore this email.
$template$,
  description = 'Email body: password reset',
  updated_at = now()
where template_key = 'emails.passwordReset.body'
  and locale = 'en';
