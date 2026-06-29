import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { sendJson } from '../../http.js';
import { validateBody, validateQuery } from '../../validation.js';
import { requireCurrentCoupleForUser } from '../shared/currentCouple.js';
import { emptyQuerySchema, gardenPlacementBodySchema, localizedQuerySchema, type GardenPlacementBody } from '../bodySchemas.js';
import { resolveLocale } from '../support.repository.js';
import {
  buildGardenPayload,
  gardenObjectIdPattern,
  getGardenObjectDetail,
  isUnlockedGardenArea,
  normalizeGardenPlacement,
  placeGardenObject,
} from '../garden/garden.service.js';

type GardenPayload = Awaited<ReturnType<typeof buildGardenPayload>>;
type GardenPlacementPayload = NonNullable<Awaited<ReturnType<typeof placeGardenObject>>>;
type GardenObjectDetailPayload = NonNullable<Awaited<ReturnType<typeof getGardenObjectDetail>>>;

export function registerGardenRoutes(router: Router) {
  router.get('/garden', requireAuth, validateQuery(localizedQuerySchema), async (request, response) => {
    const user = currentUser(request);
    const couple = await requireCurrentCoupleForUser(response, user.id);
    if (!couple) {
      return;
    }

    try {
      const locale = await resolveLocale(request);
      sendJson<GardenPayload>(response, await buildGardenPayload(couple, locale));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.patch('/garden/objects/:objectId/placement', requireAuth, validateQuery(emptyQuerySchema), validateBody(gardenPlacementBodySchema), async (request, response) => {
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

    const body = request.body as GardenPlacementBody;
    const placement = normalizeGardenPlacement(body);
    if (placement.areaKey !== undefined && !(await isUnlockedGardenArea(placement.areaKey, Number(couple.gardenStage)))) {
      sendApiError(response, 400, 'garden.invalidPlacement');
      return;
    }

    try {
      const payload = await placeGardenObject(couple, objectId, placement);
      if (!payload) {
        sendApiError(response, 404, 'garden.objectNotFound');
        return;
      }

      sendJson<GardenPlacementPayload>(response, payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/garden/objects/:objectId', requireAuth, validateQuery(localizedQuerySchema), async (request, response) => {
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
      sendJson<GardenObjectDetailPayload>(response, payload);
    } catch (error) {
      handleError(response, error);
    }
  });
}

