import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { sendJson } from '../../http.js';
import { validateBody, validateQuery } from '../../validation.js';
import { emptyBodySchema, localizedQuerySchema, loveJarNoteBodySchema, type LoveJarNoteBody } from '../bodySchemas.js';
import { createLoveJarNoteForUser, drawLoveJarNoteForUser } from '../love-jar/love-jar.service.js';
import { buildLoveJarPayload, buildLoveJarTemplatePayload, normalizeText, resolveLocale } from '../support.repository.js';

type LoveJarTemplatesPayload = Awaited<ReturnType<typeof buildLoveJarTemplatePayload>>;
type LoveJarPayload = NonNullable<Awaited<ReturnType<typeof buildLoveJarPayload>>>;

export function registerLoveJarRoutes(router: Router) {
  router.get('/love-jar/templates', requireAuth, validateQuery(localizedQuerySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);
    try {
      sendJson<LoveJarTemplatesPayload>(response, await buildLoveJarTemplatePayload(user.id, await resolveLocale(request)));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/love-jar', requireAuth, validateQuery(localizedQuerySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);

    try {
      const payload = await buildLoveJarPayload(user.id, await resolveLocale(request));
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      sendJson<LoveJarPayload>(response, payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/love-jar', requireAuth, validateQuery(localizedQuerySchema, 'rejected'), validateBody(loveJarNoteBodySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);
    const body = request.body as LoveJarNoteBody;
    const text = normalizeText(body.text);
    const category = normalizeText(body.category) || 'compliment';

    if (!text) {
      sendApiError(response, 400, 'rejected');
      return;
    }

    try {
      const result = await createLoveJarNoteForUser(user, { text, category }, await resolveLocale(request));
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
      sendJson<LoveJarPayload>(response.status(201), payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/love-jar/draw', requireAuth, validateQuery(localizedQuerySchema, 'rejected'), validateBody(emptyBodySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);

    try {
      const result = await drawLoveJarNoteForUser(user.id, await resolveLocale(request));
      if (result.status === 'notConnected') {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      if (result.status === 'alreadyDrawn') {
        sendApiError(response, 409, 'loveJar.alreadyDrawnToday');
        return;
      }
      if (result.status === 'noUnreadNote') {
        sendApiError(response, 404, 'loveJar.noUnreadNote');
        return;
      }

      const payload = result.payload;
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      sendJson<LoveJarPayload>(response, payload);
    } catch (error) {
      handleError(response, error);
    }
  });
}
