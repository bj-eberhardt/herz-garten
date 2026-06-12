import type { Request, Response, Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { validateBody } from '../../validation.js';
import { requireCurrentCoupleForUser } from '../shared/currentCouple.js';
import {
  gardenPlacementBodySchema,
} from '../bodySchemas.js';
import { resolveLocale } from '../support.repository.js';
import {
  buildGardenPayload,
  gardenObjectIdPattern,
  getGardenObjectDetail,
  isUnlockedGardenArea,
  normalizeGardenPlacement,
  placeGardenObject,
} from '../garden/garden.service.js';

export function registerGardenRoutes(router: Router) {
  router.get('/garden', requireAuth, async (request: Request, response: Response) => {
    const user = currentUser(request);
    const couple = await requireCurrentCoupleForUser(response, user.id);
    if (!couple) {
      return;
    }

    try {
      response.json(await buildGardenPayload(couple));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.patch('/garden/objects/:objectId/placement', requireAuth, validateBody(gardenPlacementBodySchema), async (request, response) => {
    const user = currentUser(request);
    const objectId = String(request.params.objectId);
    if (!gardenObjectIdPattern.test(objectId)) {
      sendApiError(response, 404, 'garden.objectNotFound');
      return;
    }

    const couple = await requireCurrentCoupleForUser(response, user.id);
    if (!couple) {
      return;
    }

    const placement = normalizeGardenPlacement(request.body ?? {});
    if (!isUnlockedGardenArea(placement.areaKey, Number(couple.gardenStage))) {
      sendApiError(response, 400, 'garden.invalidPlacement');
      return;
    }

    try {
      const payload = await placeGardenObject(couple, objectId, placement);
      if (!payload) {
        sendApiError(response, 404, 'garden.objectNotFound');
        return;
      }

      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/garden/objects/:objectId', requireAuth, async (request, response) => {
    const user = currentUser(request);
    const objectId = String(request.params.objectId);
    if (!gardenObjectIdPattern.test(objectId)) {
      sendApiError(response, 404, 'garden.objectNotFound');
      return;
    }

    try {
      const locale = await resolveLocale(request);
      const payload = await getGardenObjectDetail(user.id, objectId, locale);
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      if (!payload.object) {
        sendApiError(response, 404, 'garden.objectNotFound');
        return;
      }
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });
}


