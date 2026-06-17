import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { requireAdminAuth, signAdminToken } from './adminAuth.js';
import { config } from './config.js';
import { handleError, sendApiError } from './errors.js';
import { createRateLimiter } from './security/rateLimit.js';
import { validateBody } from './validation.js';
import { deleteUploadedImageIfManaged, saveUploadedImage, upload } from './admin/uploads.js';
import {
  adminCouplePreferencesBodySchema,
  adminLoginBodySchema,
  categoryBodySchema,
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
import { gardenAssetExists, listAdminGardenAssets, saveGardenAsset } from './api/garden/catalog.js';

export interface AdminGardenLevelItem extends GardenLevelRow {}

export interface AdminGardenLevelsResponse {
  items: AdminGardenLevelItem[];
}

export interface AdminGardenLevelMutationResponse extends AdminGardenLevelsResponse {
  id?: string;
}

function textField(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function numberField(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function booleanField(value: unknown, fallback = false) {
  if (value === undefined) return fallback;
  return value === true || value === 'true' || value === '1' || value === 'on';
}

function jsonField<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function gardenLevelMultipartBody(request: Request, backgroundImage?: string) {
  return {
    name: textField(request.body.name),
    pointsToNext: request.body.pointsToNext === '' || request.body.pointsToNext === undefined ? null : Number(request.body.pointsToNext),
    backgroundImage,
    accent: textField(request.body.accent),
    translations: jsonField(request.body.translations, {}),
  };
}

function gardenAssetMultipartBody(request: Request, image?: { path: string; width: number; height: number }) {
  return {
    key: textField(request.body.key),
    label: textField(request.body.label),
    objectType: textField(request.body.objectType),
    sourceTypes: jsonField<string[]>(request.body.sourceTypes, []),
    stageUnlock: Math.max(1, Math.round(numberField(request.body.stageUnlock, 1))),
    image: image?.path,
    width: image?.width,
    height: image?.height,
    anchorX: Math.min(1, Math.max(0, numberField(request.body.anchorX, 0.5))),
    anchorY: Math.min(1, Math.max(0, numberField(request.body.anchorY, 0.9))),
    active: booleanField(request.body.active, true),
    sortOrder: Math.round(numberField(request.body.sortOrder, 0)),
  };
}

const adminAuthRateLimit = createRateLimiter({
  keyPrefix: 'admin-auth',
  windowMs: config.authRateLimitWindowMs,
  max: config.authRateLimitMax,
});

function sendAdminError(response: Response, status: number, errorKey: string, error: string, params?: Record<string, unknown>) {
  response.status(status).json({
    errorKey,
    errorCode: errorKey,
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
        sendAdminError(response, 404, 'couple.notFound', 'Couple space not found.');
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
        sendAdminError(response, 400, 'admin.couplePreferencesInvalid', 'Couple preferences are invalid.');
        return;
      }

      const couple = await updateCouplePreferences(String(request.params.id), relationshipType, contentPreference);
      if (!couple) {
        sendAdminError(response, 404, 'couple.notFound', 'Couple space not found.');
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
        sendAdminError(response, 404, 'admin.messageTemplateNotFound', 'Message template not found.');
        return;
      }
      await audit('update', 'message-template', null, { key });
      response.json({ items: result.items });
    } catch (error) {
      if (error instanceof MessageTemplateValidationException) {
        sendAdminError(response, 400, 'admin.messageTemplateInvalid', 'Message template is invalid.', {
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

  router.post('/garden/levels', requireAdminAuth, upload.single('backgroundImage'), async (request, response) => {
    let uploadedImage: { path: string; absolutePath: string; width: number; height: number } | null = null;
    try {
      const locale = normalizeLocale(request.query.lang) || parseAcceptLanguage(request.header('accept-language')) || 'de';
      if (!request.file) {
        sendAdminError(response, 400, 'admin.gardenLevel.backgroundRequired', 'Garden level background image is required.');
        return;
      }
      uploadedImage = await saveUploadedImage(request.file, 'garden-backgrounds', { width: 700, height: 520 });
      const result = await saveGardenLevel(gardenLevelMultipartBody(request, uploadedImage.path), undefined, locale);
      await audit('create', 'garden-level', result.id, { name: request.body.name });
      const payload: AdminGardenLevelMutationResponse = result;
      response.status(201).json(payload);
    } catch (error) {
      if (uploadedImage) await deleteUploadedImageIfManaged(uploadedImage.path);
      if (error instanceof GardenLevelValidationError) {
        sendAdminError(response, 400, error.errorCode, error.message, error.params);
        return;
      }
      if (error instanceof Error && error.message === 'invalid image dimensions') {
        sendAdminError(response, 400, 'admin.upload.invalidDimensions', 'Image dimensions are invalid.');
        return;
      }
      if (error instanceof Error && (error.message === 'unsupported image type' || error.message === 'invalid image')) {
        sendAdminError(response, 400, 'admin.upload.invalidImage', 'Image file is invalid.');
        return;
      }
      handleError(response, error);
    }
  });

  router.patch('/garden/levels/:id', requireAdminAuth, upload.single('backgroundImage'), async (request, response) => {
    let uploadedImage: { path: string; absolutePath: string; width: number; height: number } | null = null;
    let oldBackgroundImage: string | undefined;
    try {
      const locale = normalizeLocale(request.query.lang) || parseAcceptLanguage(request.header('accept-language')) || 'de';
      oldBackgroundImage = (await listGardenLevels(locale)).find((level) => level.id === String(request.params.id))?.backgroundImage;
      if (request.file) {
        uploadedImage = await saveUploadedImage(request.file, 'garden-backgrounds', { width: 700, height: 520 });
      }
      const result = await saveGardenLevel(gardenLevelMultipartBody(request, uploadedImage?.path), String(request.params.id), locale);
      await audit('update', 'garden-level', result.id, { name: request.body.name });
      if (uploadedImage) await deleteUploadedImageIfManaged(oldBackgroundImage);
      const payload: AdminGardenLevelMutationResponse = result;
      response.json(payload);
    } catch (error) {
      if (uploadedImage) await deleteUploadedImageIfManaged(uploadedImage.path);
      if (error instanceof Error && error.message === 'garden level not found') {
        sendAdminError(response, 404, 'admin.gardenLevelNotFound', 'Garden level not found.');
        return;
      }
      if (error instanceof GardenLevelValidationError) {
        sendAdminError(response, 400, error.errorCode, error.message, error.params);
        return;
      }
      if (error instanceof Error && error.message === 'invalid image dimensions') {
        sendAdminError(response, 400, 'admin.upload.invalidDimensions', 'Image dimensions are invalid.');
        return;
      }
      if (error instanceof Error && (error.message === 'unsupported image type' || error.message === 'invalid image')) {
        sendAdminError(response, 400, 'admin.upload.invalidImage', 'Image file is invalid.');
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
        sendAdminError(response, 404, 'admin.gardenLevelNotFound', 'Garden level not found.');
        return;
      }
      if (result.status === 'invalid') {
        sendAdminError(response, 400, 'admin.gardenLevel.cannotDeleteFirstStage', 'Stage 1 cannot be deleted.');
        return;
      }
      await audit('delete', 'garden-level', String(request.params.id));
      response.json({ items: result.items });
    } catch (error) {
      if (error instanceof GardenLevelValidationError) {
        sendAdminError(response, 400, error.errorCode, error.message, error.params);
        return;
      }
      handleError(response, error);
    }
  });

  router.get('/garden/assets', requireAdminAuth, async (_request, response) => {
    try {
      response.json({ items: await listAdminGardenAssets() });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/garden/assets', requireAdminAuth, upload.single('image'), async (request, response) => {
    let uploadedImage: { path: string; absolutePath: string; width: number; height: number } | null = null;
    try {
      const key = textField(request.body.key);
      if (!key || !/^[a-z0-9_]+$/.test(key)) {
        sendAdminError(response, 400, 'admin.gardenAsset.keyInvalid', 'Garden asset key is invalid.');
        return;
      }
      if (await gardenAssetExists(key)) {
        sendAdminError(response, 409, 'admin.gardenAsset.keyExists', 'Garden asset key already exists.');
        return;
      }
      if (!request.file) {
        sendAdminError(response, 400, 'admin.gardenAsset.imageRequired', 'Garden asset image is required.');
        return;
      }
      uploadedImage = await saveUploadedImage(request.file, 'garden-assets');
      const item = await saveGardenAsset(gardenAssetMultipartBody(request, uploadedImage));
      await audit('create', 'garden-asset', null, { key });
      response.status(201).json({ item, items: await listAdminGardenAssets() });
    } catch (error) {
      if (uploadedImage) await deleteUploadedImageIfManaged(uploadedImage.path);
      if (error instanceof Error && (error.message === 'unsupported image type' || error.message === 'invalid image')) {
        sendAdminError(response, 400, 'admin.upload.invalidImage', 'Image file is invalid.');
        return;
      }
      handleError(response, error);
    }
  });

  router.patch('/garden/assets/:key', requireAdminAuth, upload.single('image'), async (request, response) => {
    let uploadedImage: { path: string; absolutePath: string; width: number; height: number } | null = null;
    try {
      const key = String(request.params.key);
      const existing = (await listAdminGardenAssets()).find((asset) => asset.key === key);
      if (!existing) {
        sendAdminError(response, 404, 'admin.gardenAsset.notFound', 'Garden asset not found.');
        return;
      }
      if (request.file) {
        uploadedImage = await saveUploadedImage(request.file, 'garden-assets');
      }
      const item = await saveGardenAsset(gardenAssetMultipartBody(request, uploadedImage ?? undefined), key);
      if (uploadedImage) await deleteUploadedImageIfManaged(existing.image);
      await audit('update', 'garden-asset', null, { key });
      response.json({ item, items: await listAdminGardenAssets() });
    } catch (error) {
      if (uploadedImage) await deleteUploadedImageIfManaged(uploadedImage.path);
      if (error instanceof Error && (error.message === 'unsupported image type' || error.message === 'invalid image')) {
        sendAdminError(response, 400, 'admin.upload.invalidImage', 'Image file is invalid.');
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
      sendAdminError(response, 400, 'admin.preferenceInvalid', 'Taxonomy data is invalid.');
    }
  });

  router.patch('/relationship-modes/:id', requireAdminAuth, validateBody(preferenceBodySchema), async (request, response) => {
    try {
      const id = await savePreference('relationshipModes', request.body, String(request.params.id));
      await audit('update', 'relationship-mode', id, { value: request.body.value });
      response.json({ id, items: await listPreferences('relationshipModes') });
    } catch {
      sendAdminError(response, 400, 'admin.preferenceInvalid', 'Taxonomy data is invalid.');
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
      sendAdminError(response, 400, 'admin.preferenceInvalid', 'Taxonomy data is invalid.');
    }
  });

  router.patch('/content-styles/:id', requireAdminAuth, validateBody(preferenceBodySchema), async (request, response) => {
    try {
      const id = await savePreference('contentStyles', request.body, String(request.params.id));
      await audit('update', 'content-style', id, { value: request.body.value });
      response.json({ id, items: await listPreferences('contentStyles') });
    } catch {
      sendAdminError(response, 400, 'admin.preferenceInvalid', 'Taxonomy data is invalid.');
    }
  });

  router.get('/categories', requireAdminAuth, async (request, response) => {
    try {
      const type = normalizeText(request.query.type);
      const locale = normalizeLocale(request.query.lang) || parseAcceptLanguage(request.header('accept-language')) || 'de';
      if (type && !isContentType(type)) {
        sendAdminError(response, 404, 'content.notFound', 'Content type not found.');
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
      sendAdminError(response, 400, 'admin.categoryInvalid', 'Category data is invalid.');
    }
  });

  router.patch('/categories/:id', requireAdminAuth, validateBody(categoryBodySchema), async (request, response) => {
    try {
      const id = await saveCategory(request.body, String(request.params.id));
      await audit('update', 'category', id, { contentType: request.body.contentType, value: request.body.value });
      response.json({ id, items: await listCategories() });
    } catch {
      sendAdminError(response, 400, 'admin.categoryInvalid', 'Category data is invalid.');
    }
  });

  router.delete('/categories/:id', requireAdminAuth, async (request, response) => {
    try {
      const result = await deleteCategory(String(request.params.id));
      if (result.reason === 'not_found') {
        sendAdminError(response, 404, 'admin.categoryNotFound', 'Category not found.');
        return;
      }
      if (result.reason === 'in_use') {
        sendAdminError(response, 409, 'admin.categoryInUse', 'Category is still in use.', {
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
        sendAdminError(response, 404, 'content.notFound', 'Content type not found.');
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
        sendAdminError(response, 404, 'content.notFound', 'Content type not found.');
        return;
      }
      const id = await saveContent(type, request.body);
      await audit('create', type, id, { fields: Object.keys(request.body ?? {}) });
      response.status(201).json({ id, items: await listContent(type, request) });
    } catch (error) {
      sendAdminError(response, 400, 'admin.contentInvalid', 'Content data is invalid.');
    }
  });

  router.patch('/content/:type/:id', requireAdminAuth, validateEditableContentBody, async (request, response) => {
    try {
      const type = String(request.params.type);
      if (!isEditableContentType(type)) {
        sendAdminError(response, 404, 'content.notFound', 'Content type not found.');
        return;
      }
      const id = await saveContent(type, request.body, String(request.params.id));
      await audit('update', type, id, { fields: Object.keys(request.body ?? {}) });
      response.json({ id, items: await listContent(type, request) });
    } catch (error) {
      sendAdminError(response, 400, 'admin.contentInvalid', 'Content data is invalid.');
    }
  });

  return router;
}

