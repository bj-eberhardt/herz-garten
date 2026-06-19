import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { sendJson } from '../../http.js';
import { validateBody, validateQuery } from '../../validation.js';
import { emptyBodySchema, questQuerySchema, type QuestQuery } from '../bodySchemas.js';
import { acceptQuest, completeQuest } from '../quests/quests.service.js';
import { buildQuestPayload, normalizeQuestFilters, resolveLocale } from '../support.repository.js';

type QuestsPayload = NonNullable<Awaited<ReturnType<typeof buildQuestPayload>>>;

export function registerQuestRoutes(router: Router) {
  router.get('/quests', requireAuth, validateQuery(questQuerySchema), async (request, response) => {
    const user = currentUser(request);
    const query = request.query as QuestQuery;

    try {
      const locale = await resolveLocale(request);
      const payload = await buildQuestPayload(user.id, normalizeQuestFilters(query), locale);
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      sendJson<QuestsPayload>(response, payload);
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

      sendJson<QuestsPayload>(response, result.payload);
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

      sendJson<QuestsPayload>(response, result.payload);
    } catch (error) {
      handleError(response, error);
    }
  });
}
