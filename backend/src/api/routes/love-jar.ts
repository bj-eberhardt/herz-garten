import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { validateBody } from '../../validation.js';
import { emptyBodySchema, loveJarNoteBodySchema } from '../bodySchemas.js';
import { createLoveJarNoteForUser, drawLoveJarNoteForUser } from '../love-jar/love-jar.service.js';
import { buildLoveJarPayload, buildLoveJarTemplatePayload, normalizeText, resolveLocale } from '../support.js';

export function registerLoveJarRoutes(router: Router) {
  router.get('/love-jar/templates', requireAuth, async (request, response) => {
    try {
      response.json(await buildLoveJarTemplatePayload(await resolveLocale(request)));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/love-jar', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      const payload = await buildLoveJarPayload(user.id, await resolveLocale(request));
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/love-jar', requireAuth, validateBody(loveJarNoteBodySchema), async (request, response) => {
    const user = currentUser(request);
    const text = normalizeText(request.body.text);
    const category = normalizeText(request.body.category) || 'compliment';

    if (!text) {
      sendApiError(response, 400, 'loveJar.noteRequired');
      return;
    }

    try {
      const result = await createLoveJarNoteForUser(user, { text, category }, await resolveLocale(request));
      if (result.status === 'invalidCategory') {
        sendApiError(response, 400, 'loveJar.invalidCategory');
        return;
      }
      if (result.status === 'notConnected') {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }

      response.status(201).json(result.payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/love-jar/draw', requireAuth, validateBody(emptyBodySchema), async (request, response) => {
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

      response.json(result.payload);
    } catch (error) {
      handleError(response, error);
    }
  });
}
