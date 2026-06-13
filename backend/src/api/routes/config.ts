import type { Router } from 'express';
import { listPreferenceOptions } from '../../admin/preferences.repository.js';
import { handleError } from '../../errors.js';
import { resolveLocale } from '../support.repository.js';

export function registerConfigRoutes(router: Router) {
  router.get('/config/preferences', async (request, response) => {
    try {
      response.json(await listPreferenceOptions(await resolveLocale(request)));
    } catch (error) {
      handleError(response, error);
    }
  });
}
