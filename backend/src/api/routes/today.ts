import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { validateBody } from '../../validation.js';
import { todayAnswerBodySchema } from '../bodySchemas.js';
import { answerTodayQuestion } from '../today/today.service.js';
import { buildTodayPayload, normalizeText, resolveLocale } from '../support.repository.js';

export function registerTodayRoutes(router: Router) {
  router.get('/today', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      const payload = await buildTodayPayload(user.id, await resolveLocale(request));
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/today/answer', requireAuth, validateBody(todayAnswerBodySchema), async (request, response) => {
    const user = currentUser(request);
    const answerText = normalizeText(request.body.answerText);

    if (!answerText) {
      sendApiError(response, 400, 'today.answerRequired');
      return;
    }

    try {
      const result = await answerTodayQuestion(user, answerText, await resolveLocale(request));
      if (result.status === 'notConnected') {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      if (result.status === 'accessDenied') {
        sendApiError(response, 403, 'couple.accessDenied');
        return;
      }

      response.json(result.payload);
    } catch (error) {
      handleError(response, error);
    }
  });
}
