import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { requireAdminAuth, signAdminToken } from './adminAuth.js';
import { config } from './config.js';
import { handleError, sendApiError } from './errors.js';
import { createRateLimiter } from './security/rateLimit.js';
import { validateBody } from './validation.js';
import {
  adminCouplePreferencesBodySchema,
  adminLoginBodySchema,
  categoryBodySchema,
  gardenLevelBodySchema,
  messageTemplateBodySchema,
  preferenceBodySchema,
} from './admin/bodySchemas.js';
import type { ContentType } from './admin/support.repository.js';
import { audit, buildAuditLogPayload } from './admin/audit/audit.service.js';
import { deleteCategory, listCategories, saveCategory } from './admin/categories/categories.service.js';
import {
  listMessageTemplates,
  MessageTemplateValidationException,
  saveMessageTemplate,
} from './admin/messageTemplates/messageTemplates.service.js';
import {
  listPreferences,
  preferenceValueExists,
  savePreference,
  type PreferenceKind,
} from './admin/preferences.repository.js';
import {
  buildOverview,
  getCoupleDetail,
  isContentType,
  isEditableContentType,
  listContent,
  listCouples,
  listUsers,
  normalizeLocale,
  normalizeText,
  parseAcceptLanguage,
  requestedFormat,
  saveContent,
  sendCsv,
  supportedLocales,
  updateCouplePreferences,
  validateEditableContentBody
} from './admin/support.repository.js';
import {
  deleteGardenLevel,
  GardenLevelValidationError,
  listGardenLevels,
  saveGardenLevel,
  type GardenLevelRow,
} from './api/garden/levels.repository.js';

export interface AdminGardenLevelItem extends GardenLevelRow {}

export interface AdminGardenLevelsResponse {
  items: AdminGardenLevelItem[];
}

export interface AdminGardenLevelMutationResponse extends AdminGardenLevelsResponse {
  id?: string;
}

const adminAuthRateLimit = createRateLimiter({
  keyPrefix: 'admin-auth',
  windowMs: config.authRateLimitWindowMs,
  max: config.authRateLimitMax,
});

function sendAdminError(response: Response, status: number, errorKey: string, error: string, params?: Record<string, unknown>) {
  response.status(status).json({
    errorKey,
    error,
    ...(params ? { params } : {}),
  });
}

export function adminRouter(): Router {
  const router = createRouter();

  router.post('/auth/login', adminAuthRateLimit, validateBody(adminLoginBodySchema), (request, response) => {
    const password = normalizeText(request.body.password);
    if (!password || password !== config.adminPassword) {
      sendApiError(response, 401, 'auth.invalidCredentials');
      return;
    }

    response.json({
      token: signAdminToken(),
      usesDefaultAdminPassword: config.adminPassword === 'admin',
    });
  });

  router.get('/auth/me', requireAdminAuth, (_request, response) => {
    response.json({ admin: true, usesDefaultAdminPassword: config.adminPassword === 'admin' });
  });

  router.get('/overview', requireAdminAuth, async (_request, response) => {
    try {
      response.json(await buildOverview());
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/users', requireAdminAuth, async (request, response) => {
    try {
      const payload = await listUsers(request);
      if (requestedFormat(request) === 'csv') {
        sendCsv(
          response,
          'herzgarten-users.csv',
          payload.items.map((user) => ({
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            createdAt: user.createdAt,
            couples: user.couples.map((couple: { inviteCode: string }) => couple.inviteCode),
          })),
        );
        return;
      }
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/couples', requireAdminAuth, async (request, response) => {
    try {
      const payload = await listCouples(request);
      if (requestedFormat(request) === 'csv') {
        sendCsv(
          response,
          'herzgarten-couples.csv',
          payload.items.map((couple) => ({
            id: couple.id,
            inviteCode: couple.inviteCode,
            relationshipType: couple.relationshipType,
            contentPreference: couple.contentPreference,
            heartPoints: couple.heartPoints,
            gardenStage: couple.gardenStage,
            createdAt: couple.createdAt,
            members: couple.members.map((member: { email: string }) => member.email),
          })),
        );
        return;
      }
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/couples/:id', requireAdminAuth, async (request, response) => {
    try {
      const couple = await getCoupleDetail(String(request.params.id));
      if (!couple) {
        sendAdminError(response, 404, 'couple.notFound', 'Paarraum nicht gefunden.');
        return;
      }
      response.json({ couple });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.patch('/couples/:id/preferences', requireAdminAuth, validateBody(adminCouplePreferencesBodySchema), async (request, response) => {
    try {
      const relationshipType = normalizeText(request.body.relationshipType);
      const contentPreference = normalizeText(request.body.contentPreference);
      if (
        !relationshipType ||
        !contentPreference ||
        !(await preferenceValueExists('relationshipModes', relationshipType, true)) ||
        !(await preferenceValueExists('contentStyles', contentPreference, true))
      ) {
        sendAdminError(response, 400, 'admin.couplePreferencesInvalid', 'Paarraum-Einstellungen sind ungültig.');
        return;
      }

      const couple = await updateCouplePreferences(String(request.params.id), relationshipType, contentPreference);
      if (!couple) {
        sendAdminError(response, 404, 'couple.notFound', 'Paarraum nicht gefunden.');
        return;
      }
      await audit('update', 'couple', String(request.params.id), { relationshipType, contentPreference });
      response.json({ couple });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/audit-log', requireAdminAuth, async (_request, response) => {
    try {
      response.json(await buildAuditLogPayload());
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/message-templates', requireAdminAuth, async (request, response) => {
    try {
      const namespace = normalizeText(request.query.namespace) || 'notifications';
      response.json({ items: await listMessageTemplates(namespace) });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.patch('/message-templates/:key', requireAdminAuth, validateBody(messageTemplateBodySchema), async (request, response) => {
    try {
      const key = String(request.params.key);
      const result = await saveMessageTemplate(key, request.body);
      if (result.status === 'notFound') {
        sendAdminError(response, 404, 'admin.messageTemplateNotFound', 'Nachrichtenvorlage nicht gefunden.');
        return;
      }
      await audit('update', 'message-template', null, { key });
      response.json({ items: result.items });
    } catch (error) {
      if (error instanceof MessageTemplateValidationException) {
        sendAdminError(response, 400, 'admin.messageTemplateInvalid', 'Nachrichtenvorlage ist ungültig.', {
          validationErrors: error.errors,
        });
        return;
      }
      handleError(response, error);
    }
  });

  router.get('/garden/levels', requireAdminAuth, async (request, response) => {
    try {
      const locale = normalizeLocale(request.query.lang) || parseAcceptLanguage(request.header('accept-language')) || 'de';
      const payload: AdminGardenLevelsResponse = { items: await listGardenLevels(locale) };
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/garden/levels', requireAdminAuth, validateBody(gardenLevelBodySchema), async (request, response) => {
    try {
      const locale = normalizeLocale(request.query.lang) || parseAcceptLanguage(request.header('accept-language')) || 'de';
      const result = await saveGardenLevel(request.body, undefined, locale);
      await audit('create', 'garden-level', result.id, { name: request.body.name });
      const payload: AdminGardenLevelMutationResponse = result;
      response.status(201).json(payload);
    } catch (error) {
      if (error instanceof GardenLevelValidationError) {
        sendAdminError(response, 400, 'admin.gardenLevelInvalid', error.message);
        return;
      }
      handleError(response, error);
    }
  });

  router.patch('/garden/levels/:id', requireAdminAuth, validateBody(gardenLevelBodySchema), async (request, response) => {
    try {
      const locale = normalizeLocale(request.query.lang) || parseAcceptLanguage(request.header('accept-language')) || 'de';
      const result = await saveGardenLevel(request.body, String(request.params.id), locale);
      await audit('update', 'garden-level', result.id, { name: request.body.name });
      const payload: AdminGardenLevelMutationResponse = result;
      response.json(payload);
    } catch (error) {
      if (error instanceof Error && error.message === 'garden level not found') {
        sendAdminError(response, 404, 'admin.gardenLevelNotFound', 'Gartenstufe nicht gefunden.');
        return;
      }
      if (error instanceof GardenLevelValidationError) {
        sendAdminError(response, 400, 'admin.gardenLevelInvalid', error.message);
        return;
      }
      handleError(response, error);
    }
  });

  router.delete('/garden/levels/:id', requireAdminAuth, async (request, response) => {
    try {
      const locale = normalizeLocale(request.query.lang) || parseAcceptLanguage(request.header('accept-language')) || 'de';
      const result = await deleteGardenLevel(String(request.params.id), locale);
      if (result.status === 'not_found') {
        sendAdminError(response, 404, 'admin.gardenLevelNotFound', 'Gartenstufe nicht gefunden.');
        return;
      }
      if (result.status === 'invalid') {
        sendAdminError(response, 400, 'admin.gardenLevelInvalid', 'Stufe 1 kann nicht gelöscht werden.');
        return;
      }
      await audit('delete', 'garden-level', String(request.params.id));
      response.json({ items: result.items });
    } catch (error) {
      if (error instanceof GardenLevelValidationError) {
        sendAdminError(response, 400, 'admin.gardenLevelInvalid', error.message);
        return;
      }
      handleError(response, error);
    }
  });

  router.get('/content/locales', requireAdminAuth, async (_request, response) => {
    try {
      response.json({ locales: await supportedLocales() });
    } catch (error) {
      handleError(response, error);
    }
  });

  async function handlePreferenceList(kind: PreferenceKind, request: Request, response: Response) {
    const locale = normalizeLocale(request.query.lang) || parseAcceptLanguage(request.header('accept-language')) || 'de';
    response.json({ items: await listPreferences(kind, locale) });
  }

  router.get('/relationship-modes', requireAdminAuth, async (request, response) => {
    try {
      await handlePreferenceList('relationshipModes', request, response);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/relationship-modes', requireAdminAuth, validateBody(preferenceBodySchema), async (request, response) => {
    try {
      const id = await savePreference('relationshipModes', request.body);
      await audit('create', 'relationship-mode', id, { value: request.body.value });
      response.status(201).json({ id, items: await listPreferences('relationshipModes') });
    } catch {
      sendAdminError(response, 400, 'admin.preferenceInvalid', 'Taxonomie-Daten sind ungültig.');
    }
  });

  router.patch('/relationship-modes/:id', requireAdminAuth, validateBody(preferenceBodySchema), async (request, response) => {
    try {
      const id = await savePreference('relationshipModes', request.body, String(request.params.id));
      await audit('update', 'relationship-mode', id, { value: request.body.value });
      response.json({ id, items: await listPreferences('relationshipModes') });
    } catch {
      sendAdminError(response, 400, 'admin.preferenceInvalid', 'Taxonomie-Daten sind ungültig.');
    }
  });

  router.get('/content-styles', requireAdminAuth, async (request, response) => {
    try {
      await handlePreferenceList('contentStyles', request, response);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/content-styles', requireAdminAuth, validateBody(preferenceBodySchema), async (request, response) => {
    try {
      const id = await savePreference('contentStyles', request.body);
      await audit('create', 'content-style', id, { value: request.body.value });
      response.status(201).json({ id, items: await listPreferences('contentStyles') });
    } catch {
      sendAdminError(response, 400, 'admin.preferenceInvalid', 'Taxonomie-Daten sind ungültig.');
    }
  });

  router.patch('/content-styles/:id', requireAdminAuth, validateBody(preferenceBodySchema), async (request, response) => {
    try {
      const id = await savePreference('contentStyles', request.body, String(request.params.id));
      await audit('update', 'content-style', id, { value: request.body.value });
      response.json({ id, items: await listPreferences('contentStyles') });
    } catch {
      sendAdminError(response, 400, 'admin.preferenceInvalid', 'Taxonomie-Daten sind ungültig.');
    }
  });

  router.get('/categories', requireAdminAuth, async (request, response) => {
    try {
      const type = normalizeText(request.query.type);
      const locale = normalizeLocale(request.query.lang) || parseAcceptLanguage(request.header('accept-language')) || 'de';
      if (type && !isContentType(type)) {
        sendAdminError(response, 404, 'content.notFound', 'Inhaltstyp nicht gefunden.');
        return;
      }
      response.json({ items: await listCategories(type ? (type as ContentType) : undefined, locale) });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/categories', requireAdminAuth, validateBody(categoryBodySchema), async (request, response) => {
    try {
      const id = await saveCategory(request.body);
      await audit('create', 'category', id, { contentType: request.body.contentType, value: request.body.value });
      response.status(201).json({ id, items: await listCategories() });
    } catch {
      sendAdminError(response, 400, 'admin.categoryInvalid', 'Kategorie-Daten sind ungültig.');
    }
  });

  router.patch('/categories/:id', requireAdminAuth, validateBody(categoryBodySchema), async (request, response) => {
    try {
      const id = await saveCategory(request.body, String(request.params.id));
      await audit('update', 'category', id, { contentType: request.body.contentType, value: request.body.value });
      response.json({ id, items: await listCategories() });
    } catch {
      sendAdminError(response, 400, 'admin.categoryInvalid', 'Kategorie-Daten sind ungültig.');
    }
  });

  router.delete('/categories/:id', requireAdminAuth, async (request, response) => {
    try {
      const result = await deleteCategory(String(request.params.id));
      if (result.reason === 'not_found') {
        sendAdminError(response, 404, 'admin.categoryNotFound', 'Kategorie nicht gefunden.');
        return;
      }
      if (result.reason === 'in_use') {
        sendAdminError(response, 409, 'admin.categoryInUse', 'Kategorie wird noch verwendet.', {
          usageCount: result.usageCount,
        });
        return;
      }
      await audit('delete', 'category', String(request.params.id));
      response.json({ items: await listCategories() });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/content/:type', requireAdminAuth, async (request, response) => {
    try {
      const type = String(request.params.type);
      if (!isEditableContentType(type)) {
        sendAdminError(response, 404, 'content.notFound', 'Inhaltstyp nicht gefunden.');
        return;
      }
      response.json({ items: await listContent(type, request) });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/content/:type', requireAdminAuth, validateEditableContentBody, async (request, response) => {
    try {
      const type = String(request.params.type);
      if (!isEditableContentType(type)) {
        sendAdminError(response, 404, 'content.notFound', 'Inhaltstyp nicht gefunden.');
        return;
      }
      const id = await saveContent(type, request.body);
      await audit('create', type, id, { fields: Object.keys(request.body ?? {}) });
      response.status(201).json({ id, items: await listContent(type, request) });
    } catch (error) {
      sendAdminError(response, 400, 'admin.contentInvalid', 'Inhaltsdaten sind ungültig.');
    }
  });

  router.patch('/content/:type/:id', requireAdminAuth, validateEditableContentBody, async (request, response) => {
    try {
      const type = String(request.params.type);
      if (!isEditableContentType(type)) {
        sendAdminError(response, 404, 'content.notFound', 'Inhaltstyp nicht gefunden.');
        return;
      }
      const id = await saveContent(type, request.body, String(request.params.id));
      await audit('update', type, id, { fields: Object.keys(request.body ?? {}) });
      response.json({ id, items: await listContent(type, request) });
    } catch (error) {
      sendAdminError(response, 400, 'admin.contentInvalid', 'Inhaltsdaten sind ungültig.');
    }
  });

  return router;
}

