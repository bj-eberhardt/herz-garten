import type { Router } from 'express';
import { Router as createRouter } from 'express';
import { requireAdminAuth, signAdminToken } from './adminAuth.js';
import { config } from './config.js';
import { handleError, sendApiError } from './errors.js';
import { createRateLimiter } from './security/rateLimit.js';
import { validateBody } from './validation.js';
import { adminLoginBodySchema, categoryBodySchema } from './admin/bodySchemas.js';
import type { ContentType } from './admin/support.js';
import { audit, buildAuditLogPayload } from './admin/audit/audit.service.js';
import { deleteCategory, listCategories, saveCategory } from './admin/categories/categories.service.js';
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
  validateEditableContentBody
} from './admin/support.js';

const adminAuthRateLimit = createRateLimiter({
  keyPrefix: 'admin-auth',
  windowMs: config.authRateLimitWindowMs,
  max: config.authRateLimitMax,
});

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
        response.status(404).json({ errorKey: 'couple.notFound', error: 'Paarraum nicht gefunden.' });
        return;
      }
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

  router.get('/content/locales', requireAdminAuth, async (_request, response) => {
    try {
      response.json({ locales: await supportedLocales() });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/categories', requireAdminAuth, async (request, response) => {
    try {
      const type = normalizeText(request.query.type);
      const locale = normalizeLocale(request.query.lang) || parseAcceptLanguage(request.header('accept-language')) || 'de';
      if (type && !isContentType(type)) {
        response.status(404).json({ errorKey: 'content.notFound', error: 'Content-Typ nicht gefunden.' });
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
      response.status(400).json({ errorKey: 'admin.categoryInvalid', error: 'Kategorie-Daten sind ungültig.' });
    }
  });

  router.patch('/categories/:id', requireAdminAuth, validateBody(categoryBodySchema), async (request, response) => {
    try {
      const id = await saveCategory(request.body, String(request.params.id));
      await audit('update', 'category', id, { contentType: request.body.contentType, value: request.body.value });
      response.json({ id, items: await listCategories() });
    } catch {
      response.status(400).json({ errorKey: 'admin.categoryInvalid', error: 'Kategorie-Daten sind ungültig.' });
    }
  });

  router.delete('/categories/:id', requireAdminAuth, async (request, response) => {
    try {
      const result = await deleteCategory(String(request.params.id));
      if (result.reason === 'not_found') {
        response.status(404).json({ errorKey: 'admin.categoryNotFound', error: 'Kategorie nicht gefunden.' });
        return;
      }
      if (result.reason === 'in_use') {
        response.status(409).json({
          errorKey: 'admin.categoryInUse',
          error: 'Kategorie wird noch verwendet.',
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
        response.status(404).json({ errorKey: 'content.notFound', error: 'Content-Typ nicht gefunden.' });
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
        response.status(404).json({ errorKey: 'content.notFound', error: 'Content-Typ nicht gefunden.' });
        return;
      }
      const id = await saveContent(type, request.body);
      await audit('create', type, id, { fields: Object.keys(request.body ?? {}) });
      response.status(201).json({ id, items: await listContent(type, request) });
    } catch (error) {
      response.status(400).json({ errorKey: 'admin.contentInvalid', error: 'Content-Daten sind ungültig.' });
    }
  });

  router.patch('/content/:type/:id', requireAdminAuth, validateEditableContentBody, async (request, response) => {
    try {
      const type = String(request.params.type);
      if (!isEditableContentType(type)) {
        response.status(404).json({ errorKey: 'content.notFound', error: 'Content-Typ nicht gefunden.' });
        return;
      }
      const id = await saveContent(type, request.body, String(request.params.id));
      await audit('update', type, id, { fields: Object.keys(request.body ?? {}) });
      response.json({ id, items: await listContent(type, request) });
    } catch (error) {
      response.status(400).json({ errorKey: 'admin.contentInvalid', error: 'Content-Daten sind ungültig.' });
    }
  });

  return router;
}

