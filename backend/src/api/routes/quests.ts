import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { sendJson } from '../../http.js';
import { validateBody, validateQuery, validatedQuery } from '../../validation.js';
import { emptyBodySchema, localizedQuerySchema, questQuerySchema, type QuestQuery } from '../bodySchemas.js';
import { acceptQuest, completeQuest } from '../quests/quests.service.js';
import { buildQuestPayload, normalizeQuestFilters, resolveLocale } from '../support.repository.js';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type QuestsPayload = NonNullable<Awaited<ReturnType<typeof buildQuestPayload>>>;

export function registerQuestRoutes(router: Router) {
  router.get('/quests', requireAuth, validateQuery(questQuerySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);
    const query = validatedQuery<QuestQuery>(request);

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

  router.post('/quests/:questId/accept', requireAuth, validateQuery(localizedQuerySchema, 'rejected'), validateBody(emptyBodySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);

    try {
      const questId = String(request.params.questId);
      if (!uuidPattern.test(questId)) {
        sendApiError(response, 400, 'rejected');
        return;
      }

      const result = await acceptQuest(user.id, questId, await resolveLocale(request));
      if (result.status === 'notConnected') {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      if (result.status === 'notFound') {
        sendApiError(response, 404, 'quest.notFound');
        return;
      }

      const payload = result.payload;
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      sendJson<QuestsPayload>(response, payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/quests/:questId/complete', requireAuth, validateQuery(localizedQuerySchema, 'rejected'), validateBody(emptyBodySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);

    try {
      const questId = String(request.params.questId);
      if (!uuidPattern.test(questId)) {
        sendApiError(response, 400, 'rejected');
        return;
      }

      const result = await completeQuest(user, questId, await resolveLocale(request));
      if (result.status === 'notConnected') {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      if (result.status === 'notFound') {
        sendApiError(response, 404, 'quest.notFound');
        return;
      }

      const payload = result.payload;
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      sendJson<QuestsPayload>(response, payload);
    } catch (error) {
      handleError(response, error);
    }
  });
}

