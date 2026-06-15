import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { validateBody, validateQuery } from '../../validation.js';
import { emptyBodySchema, questQuerySchema } from '../bodySchemas.js';
import { acceptQuest, completeQuest } from '../quests/quests.service.js';
import { buildQuestPayload, normalizeQuestFilters, resolveLocale } from '../support.repository.js';

export function registerQuestRoutes(router: Router) {
  router.get('/quests', requireAuth, validateQuery(questQuerySchema), async (request, response) => {
    const user = currentUser(request);

    try {
      const locale = await resolveLocale(request);
      const payload = await buildQuestPayload(user.id, normalizeQuestFilters(request.query), locale);
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/quests/:questId/accept', requireAuth, validateBody(emptyBodySchema), async (request, response) => {
    const user = currentUser(request);

    try {
      const result = await acceptQuest(user.id, String(request.params.questId), await resolveLocale(request));
      if (result.status === 'notConnected') {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      if (result.status === 'notFound') {
        sendApiError(response, 404, 'quest.notFound');
        return;
      }

      response.json(result.payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/quests/:questId/complete', requireAuth, validateBody(emptyBodySchema), async (request, response) => {
    const user = currentUser(request);

    try {
      const result = await completeQuest(user, String(request.params.questId), await resolveLocale(request));
      if (result.status === 'notConnected') {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      if (result.status === 'notFound') {
        sendApiError(response, 404, 'quest.notFound');
        return;
      }

      response.json(result.payload);
    } catch (error) {
      handleError(response, error);
    }
  });
}
