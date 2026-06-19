import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { sendJson } from '../../http.js';
import { validateBody } from '../../validation.js';
import { memoryBodySchema, type MemoryBody } from '../bodySchemas.js';
import { createMemoryForUser } from '../memories/memories.service.js';
import { buildMemoryPayload, normalizeText, resolveLocale, todayIsoDate } from '../support.repository.js';

type MemoriesPayload = NonNullable<Awaited<ReturnType<typeof buildMemoryPayload>>>;

export function registerMemoryRoutes(router: Router) {
  router.get('/memories', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      const payload = await buildMemoryPayload(user.id, await resolveLocale(request));
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      sendJson<MemoriesPayload>(response, payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/memories', requireAuth, validateBody(memoryBodySchema), async (request, response) => {
    const user = currentUser(request);
    const body = request.body as MemoryBody;
    const title = normalizeText(body.title);
    const description = normalizeText(body.description) || null;
    const date = normalizeText(body.date) || todayIsoDate();
    const category = normalizeText(body.category) || 'everyday';

    if (!title) {
      sendApiError(response, 400, 'memory.titleRequired');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      sendApiError(response, 400, 'memory.invalidDate');
      return;
    }

    try {
      const result = await createMemoryForUser(user, { title, description, date, category }, await resolveLocale(request));
      if (result.status === 'invalidCategory') {
        sendApiError(response, 400, 'memory.invalidCategory');
        return;
      }
      if (result.status === 'notConnected') {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }

      sendJson<MemoriesPayload>(response.status(201), result.payload);
    } catch (error) {
      handleError(response, error);
    }
  });
}
