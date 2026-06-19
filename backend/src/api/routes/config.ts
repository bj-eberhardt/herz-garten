import type { Router } from 'express';
import { listPreferenceOptions } from '../../admin/preferences.repository.js';
import { config } from '../../config.js';
import { handleError } from '../../errors.js';
import { listSupportedLocales } from '../config.repository.js';
import { resolveLocale } from '../support.repository.js';

export function registerConfigRoutes(router: Router) {
  router.get('/config', async (_request, response) => {
    try {
      const supportedLocales = await listSupportedLocales();

      response.json({
        defaultLocale: config.i18nDefaultLocale,
        supportedLocales: supportedLocales.map((locale) => ({
          ...locale,
          isDefault: locale.locale === config.i18nDefaultLocale || locale.isDefault,
        })),
      });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/config/preferences', async (request, response) => {
    try {
      response.json(await listPreferenceOptions(await resolveLocale(request)));
    } catch (error) {
      handleError(response, error);
    }
  });
}
