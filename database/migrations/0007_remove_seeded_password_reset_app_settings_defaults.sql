-- Keep password reset ENV values as fallbacks. Remove only inert seeded
-- defaults that would otherwise mask PASSWORD_RESET_* environment variables.

delete from public.app_settings
where (key = 'passwordReset.ttlMinutes' and value = '30'::jsonb)
   or (key = 'passwordReset.limitPer24h' and value = '3'::jsonb);
