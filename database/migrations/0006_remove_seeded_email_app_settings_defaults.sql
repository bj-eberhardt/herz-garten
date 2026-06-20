-- Earlier development versions seeded empty/default email settings into
-- app_settings. Those rows unintentionally override ENV configuration. Remove
-- only the known inert defaults so real admin-edited values stay untouched.

delete from public.app_settings
where (key = 'email.enabled' and value = 'false'::jsonb)
   or (key = 'email.smtpHost' and value = '""'::jsonb)
   or (key = 'email.smtpPort' and value = '587'::jsonb)
   or (key = 'email.smtpSecure' and value = 'false'::jsonb)
   or (key = 'email.smtpUser' and value = '""'::jsonb)
   or (key = 'email.smtpPassword' and value = '""'::jsonb)
   or (key = 'email.fromAddress' and value = '""'::jsonb)
   or (key = 'email.fromName' and value = '"Herzgarten"'::jsonb)
   or (key = 'email.replyTo' and value = '""'::jsonb)
   or (key = 'email.passwordResetBaseUrl' and value = '"http://localhost:5173"'::jsonb)
   or (key = 'email.passwordResetTtlMinutes' and value = '30'::jsonb)
   or (key = 'server.publicBaseUrl' and value = '"http://localhost:5173"'::jsonb);
