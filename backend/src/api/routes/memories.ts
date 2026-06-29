import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { sendJson } from '../../http.js';
import { validateBody, validateQuery } from '../../validation.js';
import { localizedQuerySchema, memoryBodySchema, type MemoryBody } from '../bodySchemas.js';
import { createMemoryForUser } from '../memories/memories.service.js';
import { buildMemoryPayload, normalizeText, resolveLocale, todayIsoDate } from '../support.repository.js';

type MemoriesPayload = NonNullable<Awaited<ReturnType<typeof buildMemoryPayload>>>;

function isValidIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCFullYear(year);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function registerMemoryRoutes(router: Router) {
  router.get('/memories', requireAuth, validateQuery(localizedQuerySchema, 'rejected'), async (request, response) => {
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

  router.post('/memories', requireAuth, validateQuery(localizedQuerySchema, 'rejected'), validateBody(memoryBodySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);
    const body = request.body as MemoryBody;
    const title = normalizeText(body.title);
    const description = normalizeText(body.description) || null;
    const date = normalizeText(body.date) || todayIsoDate();
    const category = normalizeText(body.category) || 'everyday';

    if (!title) {
      sendApiError(response, 400, 'rejected');
      return;
    }

    if (!isValidIsoDate(date)) {
      sendApiError(response, 400, 'rejected');
      return;
    }

    try {
      const result = await createMemoryForUser(user, { title, description, date, category }, await resolveLocale(request));
      if (result.status === 'invalidCategory') {
        sendApiError(response, 400, 'rejected');
        return;
      }
      if (result.status === 'notConnected') {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }

      const payload = result.payload;
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      sendJson<MemoriesPayload>(response.status(201), payload);
    } catch (error) {
      handleError(response, error);
    }
  });
}
