import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { sendJson } from '../../http.js';
import { validateBody, validateQuery } from '../../validation.js';
import { localizedQuerySchema, todayAnswerBodySchema, type TodayAnswerBody } from '../bodySchemas.js';
import { answerTodayQuestion } from '../today/today.service.js';
import { buildTodayPayload, normalizeText, resolveLocale } from '../support.repository.js';

type TodayPayload = NonNullable<Awaited<ReturnType<typeof buildTodayPayload>>>;

export function registerTodayRoutes(router: Router) {
  router.get('/today', requireAuth, validateQuery(localizedQuerySchema), async (request, response) => {
    const user = currentUser(request);

    try {
      const payload = await buildTodayPayload(user.id, await resolveLocale(request));
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      sendJson<TodayPayload>(response, payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/today/answer', requireAuth, validateQuery(localizedQuerySchema), validateBody(todayAnswerBodySchema), async (request, response) => {
    const user = currentUser(request);
    const body = request.body as TodayAnswerBody;
    const answerText = normalizeText(body.answerText);

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

      const payload = result.payload;
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      sendJson<TodayPayload>(response, payload);
    } catch (error) {
      handleError(response, error);
    }
  });
}

