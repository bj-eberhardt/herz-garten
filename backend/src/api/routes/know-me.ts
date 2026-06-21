import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { sendJson } from '../../http.js';
import { validateBody } from '../../validation.js';
import {
  knowMeCreateBodySchema,
  knowMeGuessBodySchema,
  type KnowMeCreateBody,
  type KnowMeGuessBody,
} from '../bodySchemas.js';
import { createKnowMeQuestionForUser, guessKnowMeQuestionForUser } from '../know-me/know-me.service.js';
import { buildKnowMePayload, normalizeText, resolveLocale } from '../support.repository.js';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type KnowMePayload = NonNullable<Awaited<ReturnType<typeof buildKnowMePayload>>>;

export function registerKnowMeRoutes(router: Router) {
  router.get('/know-me', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      const payload = await buildKnowMePayload(user.id, await resolveLocale(request));
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      sendJson<KnowMePayload>(response, payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/know-me', requireAuth, validateBody(knowMeCreateBodySchema), async (request, response) => {
    const user = currentUser(request);
    const body = request.body as KnowMeCreateBody;
    const freeQuestionText = normalizeText(body.questionText);
    const catalogQuestionId = normalizeText(body.catalogQuestionId) || null;
    const options = Array.isArray(body.options)
      ? body.options.map((option) => normalizeText(option)).filter(Boolean)
      : [];
    const correctOptionIndex = Number(body.correctOptionIndex);

    if (catalogQuestionId && !uuidPattern.test(catalogQuestionId)) {
      sendApiError(response, 400, 'knowMe.invalidCatalogQuestionId');
      return;
    }

    if ((!catalogQuestionId && !freeQuestionText) || options.length < 2 || options.length > 4) {
      sendApiError(response, 400, 'knowMe.questionInvalid');
      return;
    }

    if (!Number.isInteger(correctOptionIndex) || correctOptionIndex < 0 || correctOptionIndex >= options.length) {
      sendApiError(response, 400, 'knowMe.correctOptionInvalid');
      return;
    }

    try {
      const result = await createKnowMeQuestionForUser(
        user,
        { questionText: freeQuestionText, catalogQuestionId, options, correctOptionIndex },
        await resolveLocale(request),
      );
      if (result.status === 'notConnected') {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      if (result.status === 'catalogNotFound') {
        sendApiError(response, 400, 'knowMe.catalogQuestionNotFound');
        return;
      }
      if (result.status === 'catalogAlreadyUsed') {
        sendApiError(response, 409, 'knowMe.catalogQuestionAlreadyUsed');
        return;
      }

      const payload = result.payload;
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      sendJson<KnowMePayload>(response.status(201), payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/know-me/:questionId/guess', requireAuth, validateBody(knowMeGuessBodySchema), async (request, response) => {
    const user = currentUser(request);
    const body = request.body as KnowMeGuessBody;
    const selectedOptionIndex = Number(body.selectedOptionIndex);

    if (!Number.isInteger(selectedOptionIndex) || selectedOptionIndex < 0 || selectedOptionIndex > 3) {
      sendApiError(response, 400, 'knowMe.selectedOptionInvalid');
      return;
    }

    try {
      const result = await guessKnowMeQuestionForUser(
        user,
        String(request.params.questionId),
        selectedOptionIndex,
        await resolveLocale(request),
      );
      if (result.status === 'notConnected') {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      if (result.status === 'notFound') {
        sendApiError(response, 404, 'knowMe.questionNotFound');
        return;
      }
      if (result.status === 'ownQuestion') {
        sendApiError(response, 403, 'knowMe.authorCannotGuessOwnQuestion');
        return;
      }
      if (result.status === 'alreadyAnswered') {
        sendApiError(response, 409, 'knowMe.questionAlreadyAnswered');
        return;
      }
      if (result.status === 'optionDoesNotExist') {
        sendApiError(response, 400, 'knowMe.optionDoesNotExist');
        return;
      }

      const payload = result.payload;
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      sendJson<KnowMePayload>(response, payload);
    } catch (error) {
      handleError(response, error);
    }
  });
}
