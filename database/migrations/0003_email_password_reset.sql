create table if not exists public.password_reset_tokens (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.password_reset_requests (
  id uuid primary key,
  email_hash text not null,
  created_at timestamp with time zone default now() not null
);

create index if not exists password_reset_tokens_user_active_idx
  on public.password_reset_tokens (user_id, created_at desc)
  where used_at is null;

create index if not exists password_reset_tokens_expires_idx
  on public.password_reset_tokens (expires_at);

create index if not exists password_reset_requests_email_created_idx
  on public.password_reset_requests (email_hash, created_at desc);

insert into public.message_templates (key, namespace, required_params, active, created_at, updated_at)
values
  ('emails.passwordReset.subject', 'email', '{}', true, now(), now()),
  ('emails.passwordReset.body', 'email', '{displayName,resetUrl,expiresInMinutes}', true, now(), now())
on conflict (key) do nothing;

insert into public.message_template_translations (template_key, locale, text, description, created_at, updated_at)
values
  (
    'emails.passwordReset.subject',
    'de',
    'Passwort für deinen Herzgarten zurücksetzen',
    'E-Mail-Betreff: Passwort zurücksetzen',
    now(),
    now()
  ),
  (
    'emails.passwordReset.body',
    'de',
    'Hallo {displayName},\n\nmit diesem Link kannst du dein Herzgarten-Passwort zurücksetzen:\n{resetUrl}\n\nDer Link ist {expiresInMinutes} Minuten gültig. Falls du das nicht angefragt hast, kannst du diese E-Mail ignorieren.',
    'E-Mail-Text: Passwort zurücksetzen',
    now(),
    now()
  ),
  (
    'emails.passwordReset.subject',
    'en',
    'Reset your Herzgarten password',
    'Email subject: password reset',
    now(),
    now()
  ),
  (
    'emails.passwordReset.body',
    'en',
    'Hello {displayName},\n\nUse this link to reset your Herzgarten password:\n{resetUrl}\n\nThe link is valid for {expiresInMinutes} minutes. If you did not request this, you can ignore this email.',
    'Email body: password reset',
    now(),
    now()
  )
on conflict (template_key, locale) do nothing;
