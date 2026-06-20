import type { Router } from 'express';
import { listPreferenceOptions } from '../../admin/preferences.repository.js';
import { config } from '../../config.js';
import { handleError } from '../../errors.js';
import { sendJson } from '../../http.js';
import { configResponseSchema, type ConfigResponse } from '../bodySchemas.js';
import { listSupportedLocales } from '../config.repository.js';
import { resolveLocale } from '../support.repository.js';
import { isEmailAvailable } from '../../email/email.service.js';

type PreferenceOptionsPayload = Awaited<ReturnType<typeof listPreferenceOptions>>;

export function registerConfigRoutes(router: Router) {
  router.get('/config', async (_request, response) => {
    try {
      const supportedLocales = await listSupportedLocales();

      const payload = configResponseSchema.parse({
        defaultLocale: config.i18nDefaultLocale,
        supportedLocales: supportedLocales.map((locale) => ({
          ...locale,
          isDefault: locale.locale === config.i18nDefaultLocale || locale.isDefault,
        })),
        features: {
          passwordResetEmailEnabled: await isEmailAvailable(),
        },
      });
      sendJson<ConfigResponse>(response, payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/config/preferences', async (request, response) => {
    try {
      sendJson<PreferenceOptionsPayload>(response, await listPreferenceOptions(await resolveLocale(request)));
    } catch (error) {
      handleError(response, error);
    }
  });
}
