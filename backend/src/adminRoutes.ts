import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { requireAdminAuth, signAdminToken } from './adminAuth.js';
import { config } from './config.js';
import { handleError, sendApiError } from './errors.js';
import { createRateLimiter } from './security/rateLimit.js';
import { validateBody, validateQuery, validatedQuery } from './validation.js';
import { deleteUploadedImageIfManaged, saveUploadedImage, upload } from './admin/uploads.js';
import {
  adminCouplePreferencesBodySchema,
  adminCategoriesQuerySchema,
  adminContentListQuerySchema,
  adminListQuerySchema,
  adminLocalizedQuerySchema,
  adminMessageTemplatesQuerySchema,
  emptyQuerySchema,
  type AdminCategoriesQuery,
  type AdminLocalizedQuery,
  type AdminMessageTemplatesQuery,
  adminLoginBodySchema,
  adminSettingsBodySchema,
  adminUserPasswordBodySchema,
  categoryBodySchema,
  messageTemplateBodySchema,
  preferenceBodySchema,
} from './admin/bodySchemas.js';
import type { ContentType } from './admin/support.repository.js';
import { audit, buildAuditLogPayload } from './admin/audit/audit.service.js';
import { deleteCategory, defaultTranslationMissingMessage, listCategories, saveCategory } from './admin/categories/categories.service.js';
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
import { getAdminSettings, saveAdminSettings } from './admin/settings.service.js';
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
  resetUserPasswordByAdmin,
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
  type GardenLevelInput,
  type GardenLevelRow,
} from './api/garden/levels.repository.js';
import { gardenAssetExists, listAdminGardenAssets, saveGardenAsset } from './api/garden/catalog.js';

export type AdminGardenLevelItem = GardenLevelRow;

export interface AdminGardenLevelsResponse {
  items: AdminGardenLevelItem[];
}

export interface AdminGardenLevelMutationResponse extends AdminGardenLevelsResponse {
  id?: string;
}

function textField(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}


const localeCodePattern = /^[a-z]{2}(?:-[A-Z]{2})?$/;

function parseGardenLevelPoints(body: Record<string, unknown>, issues: ValidationIssue[]) {
  const value = multipartString(body, 'pointsToNext');
  if (!value) return null;
  if (!/^\d+$/.test(value)) {
    issues.push({ path: 'pointsToNext', message: 'Expected positive integer' });
    return null;
  }
  return Number(value);
}

function parseGardenLevelTranslations(body: Record<string, unknown>, issues: ValidationIssue[]) {
  const value = multipartString(body, 'translations');
  if (!value) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    issues.push({ path: 'translations', message: 'Expected JSON object' });
    return {};
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    issues.push({ path: 'translations', message: 'Expected JSON object' });
    return {};
  }

  const translations: Record<string, { name?: string }> = {};
  for (const [locale, rawTranslation] of Object.entries(parsed)) {
    if (!localeCodePattern.test(locale)) {
      issues.push({ path: `translations.${locale}`, message: 'Invalid locale' });
      continue;
    }
    if (!rawTranslation || typeof rawTranslation !== 'object' || Array.isArray(rawTranslation)) {
      issues.push({ path: `translations.${locale}`, message: 'Expected object' });
      continue;
    }
    const translation = rawTranslation as Record<string, unknown>;
    const extraFields = Object.keys(translation).filter((field) => field !== 'name');
    if (extraFields.length > 0) {
      issues.push({ path: `translations.${locale}`, message: 'Unexpected field' });
      continue;
    }
    if ('name' in translation) {
      if (typeof translation.name !== 'string' || !translation.name.trim()) {
        issues.push({ path: `translations.${locale}.name`, message: 'Expected non-empty string' });
        continue;
      }
      translations[locale] = { name: translation.name.trim() };
    } else {
      translations[locale] = {};
    }
  }

  return translations;
}

function gardenLevelMultipartBody(request: Request, backgroundImage?: string) {
  const body = request.body as Record<string, unknown>;
  const issues: ValidationIssue[] = [];
  const pointsToNext = parseGardenLevelPoints(body, issues);
  const translations = parseGardenLevelTranslations(body, issues);

  if (issues.length > 0) return { ok: false as const, issues };

  return {
    ok: true as const,
    value: {
      name: textField(body.name),
      pointsToNext,
      backgroundImage,
      accent: textField(body.accent),
      translations,
    } satisfies GardenLevelInput,
  };
}

async function unsupportedGardenLevelTranslationLocales(translations: Record<string, { name?: string }>) {
  const localeCodes = Object.keys(translations);
  if (localeCodes.length === 0) return [];
  const activeLocales = new Set((await supportedLocales()).filter((locale) => locale.active).map((locale) => locale.locale));
  return localeCodes.filter((locale) => !activeLocales.has(locale));
}

function validateGardenLevelRequiredFields(response: Response, input: GardenLevelInput) {
  if (!input.name) {
    sendAdminError(response, 400, 'admin.gardenLevel.nameRequired', 'Garden level name is required.');
    return false;
  }
  if (!input.accent || !/^#[0-9a-f]{6}$/i.test(input.accent)) {
    sendAdminError(response, 400, 'admin.gardenLevel.accentRequired', 'Garden level accent color is required.');
    return false;
  }
  return true;
}

const gardenAssetSourceTypes = new Set(['question', 'quest', 'memory', 'love_jar', 'milestone', 'know_me']);

interface ValidationIssue {
  path: string;
  message: string;
}

function multipartString(body: Record<string, unknown>, field: string) {
  const value = body[field];
  return typeof value === 'string' ? value.trim() : undefined;
}

function parseRequiredMultipartString(body: Record<string, unknown>, field: string, issues: ValidationIssue[]) {
  const value = multipartString(body, field);
  if (!value) {
    issues.push({ path: field, message: 'Required' });
    return '';
  }
  return value;
}

function parseMultipartInteger(body: Record<string, unknown>, field: string, issues: ValidationIssue[], options: { required?: boolean; min?: number } = {}) {
  const value = multipartString(body, field);
  if (!value) {
    if (options.required) issues.push({ path: field, message: 'Required' });
    return undefined;
  }
  if (!/^-?\d+$/.test(value)) {
    issues.push({ path: field, message: 'Expected integer' });
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || (options.min !== undefined && parsed < options.min)) {
    issues.push({ path: field, message: options.min !== undefined ? `Must be >= ${options.min}` : 'Expected integer' });
    return undefined;
  }
  return parsed;
}

function parseMultipartNumber(body: Record<string, unknown>, field: string, issues: ValidationIssue[], options: { min: number; max: number }) {
  const value = multipartString(body, field);
  if (!value) {
    issues.push({ path: field, message: 'Required' });
    return 0;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < options.min || parsed > options.max) {
    issues.push({ path: field, message: `Must be between ${options.min} and ${options.max}` });
    return 0;
  }
  return parsed;
}

function parseMultipartBoolean(body: Record<string, unknown>, field: string, issues: ValidationIssue[]) {
  const value = multipartString(body, field);
  if (!value) {
    issues.push({ path: field, message: 'Required' });
    return false;
  }
  if (value !== 'true' && value !== 'false') {
    issues.push({ path: field, message: 'Expected boolean' });
    return false;
  }
  return value === 'true';
}

function parseGardenAssetSourceTypes(body: Record<string, unknown>, issues: ValidationIssue[]) {
  const value = multipartString(body, 'sourceTypes');
  if (!value) {
    issues.push({ path: 'sourceTypes', message: 'Required' });
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    issues.push({ path: 'sourceTypes', message: 'Expected JSON array' });
    return [];
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    issues.push({ path: 'sourceTypes', message: 'Expected non-empty array' });
    return [];
  }

  const sourceTypes = parsed.map((item) => (typeof item === 'string' ? item.trim() : ''));
  if (sourceTypes.some((item) => !item || !gardenAssetSourceTypes.has(item))) {
    issues.push({ path: 'sourceTypes', message: 'Contains unsupported source type' });
    return [];
  }

  return sourceTypes;
}

function gardenAssetMultipartBody(request: Request, key: string) {
  const body = request.body as Record<string, unknown>;
  const issues: ValidationIssue[] = [];
  const label = parseRequiredMultipartString(body, 'label', issues);
  const sourceTypes = parseGardenAssetSourceTypes(body, issues);
  const stageUnlock = parseMultipartInteger(body, 'stageUnlock', issues, { required: true, min: 1 }) ?? 1;
  const anchorX = parseMultipartNumber(body, 'anchorX', issues, { min: 0, max: 1 });
  const anchorY = parseMultipartNumber(body, 'anchorY', issues, { min: 0, max: 1 });
  const active = parseMultipartBoolean(body, 'active', issues);
  const sortOrder = parseMultipartInteger(body, 'sortOrder', issues) ?? 0;

  if (issues.length > 0) return { ok: false as const, issues };

  return {
    ok: true as const,
    value: {
      key,
      label,
      sourceTypes,
      stageUnlock,
      anchorX,
      anchorY,
      active,
      sortOrder,
    },
  };
}

const adminAuthRateLimit = createRateLimiter({
  keyPrefix: 'admin-auth',
  windowMs: config.authRateLimitWindowMs,
  max: config.authRateLimitMax,
});


function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function sendValidationError(response: Response, issues: ValidationIssue[]) {
  sendApiError(response, 400, 'common.validation', { issues });
}

function defaultTranslationMissingErrorMessage() {
  return `Default Translation "${config.i18nDefaultLocale}" is missing`;
}

function sendDefaultTranslationMissingError(response: Response) {
  sendAdminError(response, 400, 'admin.defaultTranslationMissing', defaultTranslationMissingErrorMessage(), {
    locale: config.i18nDefaultLocale,
  });
}
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

  router.post('/auth/login', adminAuthRateLimit, validateQuery(emptyQuerySchema), validateBody(adminLoginBodySchema), async (request, response) => {
    const password = normalizeText(request.body.password);
    if (!password || password !== config.adminPassword) {
      sendApiError(response, 401, 'auth.invalidCredentials');
      return;
    }

    try {
      response.json({
        token: await signAdminToken(),
        usesDefaultAdminPassword: config.adminPassword === 'admin',
      });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/auth/me', requireAdminAuth, validateQuery(emptyQuerySchema), (_request, response) => {
    response.json({ admin: true, usesDefaultAdminPassword: config.adminPassword === 'admin' });
  });

  router.get('/overview', requireAdminAuth, async (_request, response) => {
    try {
      response.json(await buildOverview());
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/users', requireAdminAuth, validateQuery(adminListQuerySchema), async (request, response) => {
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

  router.post('/users/:id/password', requireAdminAuth, validateBody(adminUserPasswordBodySchema), async (request, response) => {
    try {
      const user = await resetUserPasswordByAdmin(
        String(request.params.id),
        normalizeText(request.body.password),
        String(request.header('accept-language') ?? config.i18nDefaultLocale).slice(0, 2),
      );
      if (!user) {
        sendAdminError(response, 404, 'admin.userNotFound', 'User not found.');
        return;
      }

      await audit('update', 'user-password', user.id);
      response.json({ user });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/couples', requireAdminAuth, validateQuery(adminListQuerySchema), async (request, response) => {
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

  router.get('/couples/:id', requireAdminAuth, validateQuery(emptyQuerySchema), async (request, response) => {
    try {
      const coupleId = String(request.params.id);
      if (!isUuid(coupleId)) {
        sendAdminError(response, 404, 'couple.notFound', 'Couple space not found.');
        return;
      }

      const couple = await getCoupleDetail(coupleId);
      if (!couple) {
        sendAdminError(response, 404, 'couple.notFound', 'Couple space not found.');
        return;
      }
      response.json({ couple });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.patch('/couples/:id/preferences', requireAdminAuth, validateQuery(emptyQuerySchema), validateBody(adminCouplePreferencesBodySchema), async (request, response) => {
    try {
      const coupleId = String(request.params.id);
      if (!isUuid(coupleId)) {
        sendAdminError(response, 404, 'couple.notFound', 'Couple space not found.');
        return;
      }

      const relationshipType = normalizeText(request.body.relationshipType);
      const contentPreference = normalizeText(request.body.contentPreference);
      if (
        !(await preferenceValueExists('relationshipModes', relationshipType, true)) ||
        !(await preferenceValueExists('contentStyles', contentPreference, true))
      ) {
        sendAdminError(response, 400, 'admin.couplePreferencesInvalid', 'Couple preferences are invalid.');
        return;
      }

      const couple = await updateCouplePreferences(coupleId, relationshipType, contentPreference);
      if (!couple) {
        sendAdminError(response, 404, 'couple.notFound', 'Couple space not found.');
        return;
      }
      await audit('update', 'couple', coupleId, { relationshipType, contentPreference });
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

  router.get('/settings', requireAdminAuth, validateQuery(emptyQuerySchema), async (_request, response) => {
    try {
      response.json(await getAdminSettings());
    } catch (error) {
      handleError(response, error);
    }
  });

  router.patch('/settings', requireAdminAuth, validateQuery(emptyQuerySchema), validateBody(adminSettingsBodySchema), async (request, response) => {
    try {
      const settings = await saveAdminSettings(request.body);
      await audit('update', 'app-settings', null, {
        keys: [
          'auth.adminJwtTtlMinutes',
          'auth.userJwtTtlMinutes',
          'server.publicBaseUrl',
          'passwordReset.ttlMinutes',
          'passwordReset.limitPer24h',
          'email.enabled',
          'email.smtpHost',
          'email.fromAddress',
        ],
      });
      response.json(settings);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/message-templates', requireAdminAuth, validateQuery(adminMessageTemplatesQuerySchema), async (request, response) => {
    try {
      const query = validatedQuery<AdminMessageTemplatesQuery>(request);
      const namespace = normalizeText(query.namespace) || 'notifications';
      const locale = normalizeLocale(query.lang) || parseAcceptLanguage(request.header('accept-language')) || config.i18nDefaultLocale;
      response.json({ items: await listMessageTemplates(namespace, locale) });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.patch('/message-templates/:key', requireAdminAuth, validateQuery(adminLocalizedQuerySchema), validateBody(messageTemplateBodySchema), async (request, response) => {
    try {
      const key = String(request.params.key);
      const query = validatedQuery<AdminLocalizedQuery>(request);
      const locale = normalizeLocale(query.lang) || parseAcceptLanguage(request.header('accept-language')) || config.i18nDefaultLocale;
      const result = await saveMessageTemplate(key, request.body, locale);
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

  router.get('/garden/levels', requireAdminAuth, validateQuery(adminLocalizedQuerySchema), async (request, response) => {
    try {
      const query = validatedQuery<AdminLocalizedQuery>(request);
      const locale = normalizeLocale(query.lang) || parseAcceptLanguage(request.header('accept-language')) || 'de';
      const payload: AdminGardenLevelsResponse = { items: await listGardenLevels(locale) };
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/garden/levels', requireAdminAuth, validateQuery(adminLocalizedQuerySchema), upload.single('backgroundImage'), async (request, response) => {
    let uploadedImage: { path: string; absolutePath: string; width: number; height: number } | null = null;
    try {
      const query = validatedQuery<AdminLocalizedQuery>(request);
      const locale = normalizeLocale(query.lang) || parseAcceptLanguage(request.header('accept-language')) || 'de';
      if (!request.file) {
        sendAdminError(response, 400, 'admin.gardenLevel.backgroundRequired', 'Garden level background image is required.');
        return;
      }
      const parsedBody = gardenLevelMultipartBody(request);
      if (!parsedBody.ok) {
        sendValidationError(response, parsedBody.issues);
        return;
      }
      if (!validateGardenLevelRequiredFields(response, parsedBody.value)) return;
      const unsupportedLocales = await unsupportedGardenLevelTranslationLocales(parsedBody.value.translations ?? {});
      if (unsupportedLocales.length > 0) {
        sendAdminError(response, 400, 'admin.gardenLevel.translationInvalid', 'Garden level translations are invalid.', { locales: unsupportedLocales });
        return;
      }
      uploadedImage = await saveUploadedImage(request.file, 'garden-backgrounds', { width: 700, height: 520 });
      const result = await saveGardenLevel({ ...parsedBody.value, backgroundImage: uploadedImage.path }, undefined, locale);
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

  router.patch('/garden/levels/:id', requireAdminAuth, validateQuery(adminLocalizedQuerySchema), upload.single('backgroundImage'), async (request, response) => {
    let uploadedImage: { path: string; absolutePath: string; width: number; height: number } | null = null;
    let oldBackgroundImage: string | undefined;
    try {
      const levelId = String(request.params.id);
      if (!isUuid(levelId)) {
        sendAdminError(response, 404, 'admin.gardenLevelNotFound', 'Garden level not found.');
        return;
      }
      const query = validatedQuery<AdminLocalizedQuery>(request);
      const locale = normalizeLocale(query.lang) || parseAcceptLanguage(request.header('accept-language')) || 'de';
      oldBackgroundImage = (await listGardenLevels(locale)).find((level) => level.id === levelId)?.backgroundImage;
      const parsedBody = gardenLevelMultipartBody(request);
      if (!parsedBody.ok) {
        sendValidationError(response, parsedBody.issues);
        return;
      }
      if (!validateGardenLevelRequiredFields(response, parsedBody.value)) return;
      const unsupportedLocales = await unsupportedGardenLevelTranslationLocales(parsedBody.value.translations ?? {});
      if (unsupportedLocales.length > 0) {
        sendAdminError(response, 400, 'admin.gardenLevel.translationInvalid', 'Garden level translations are invalid.', { locales: unsupportedLocales });
        return;
      }
      if (request.file) {
        uploadedImage = await saveUploadedImage(request.file, 'garden-backgrounds', { width: 700, height: 520 });
      }
      const result = await saveGardenLevel({ ...parsedBody.value, backgroundImage: uploadedImage?.path }, levelId, locale);
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

  router.delete('/garden/levels/:id', requireAdminAuth, validateQuery(adminLocalizedQuerySchema), async (request, response) => {
    try {
      const levelId = String(request.params.id);
      if (!isUuid(levelId)) {
        sendAdminError(response, 404, 'admin.gardenLevelNotFound', 'Garden level not found.');
        return;
      }
      const query = validatedQuery<AdminLocalizedQuery>(request);
      const locale = normalizeLocale(query.lang) || parseAcceptLanguage(request.header('accept-language')) || 'de';
      const result = await deleteGardenLevel(levelId, locale);
      if (result.status === 'not_found') {
        sendAdminError(response, 404, 'admin.gardenLevelNotFound', 'Garden level not found.');
        return;
      }
      if (result.status === 'invalid') {
        sendAdminError(response, 400, 'admin.gardenLevel.cannotDeleteFirstStage', 'Stage 1 cannot be deleted.');
        return;
      }
      await audit('delete', 'garden-level', levelId);
      response.json({ items: result.items });
    } catch (error) {
      if (error instanceof GardenLevelValidationError) {
        sendAdminError(response, 400, error.errorCode, error.message, error.params);
        return;
      }
      handleError(response, error);
    }
  });

  router.get('/garden/assets', requireAdminAuth, validateQuery(emptyQuerySchema), async (_request, response) => {
    try {
      response.json({ items: await listAdminGardenAssets() });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/garden/assets', requireAdminAuth, validateQuery(emptyQuerySchema), upload.single('image'), async (request, response) => {
    let uploadedImage: { path: string; absolutePath: string; width: number; height: number } | null = null;
    try {
      const key = textField(request.body.key);
      if (!key || !/^[a-z0-9_]+$/.test(key)) {
        sendAdminError(response, 400, 'admin.gardenAsset.keyInvalid', 'Garden asset key is invalid.');
        return;
      }
      const parsedBody = gardenAssetMultipartBody(request, key);
      if (!parsedBody.ok) {
        sendValidationError(response, parsedBody.issues);
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
      const item = await saveGardenAsset({ ...parsedBody.value, image: uploadedImage.path, width: uploadedImage.width, height: uploadedImage.height });
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

  router.patch('/garden/assets/:key', requireAdminAuth, validateQuery(emptyQuerySchema), upload.single('image'), async (request, response) => {
    let uploadedImage: { path: string; absolutePath: string; width: number; height: number } | null = null;
    try {
      const key = String(request.params.key);
      const existing = (await listAdminGardenAssets()).find((asset) => asset.key === key);
      if (!existing) {
        sendAdminError(response, 404, 'admin.gardenAsset.notFound', 'Garden asset not found.');
        return;
      }
      const parsedBody = gardenAssetMultipartBody(request, key);
      if (!parsedBody.ok) {
        sendValidationError(response, parsedBody.issues);
        return;
      }
      if (request.file) {
        uploadedImage = await saveUploadedImage(request.file, 'garden-assets');
      }
      const item = await saveGardenAsset({ ...parsedBody.value, image: uploadedImage?.path, width: uploadedImage?.width, height: uploadedImage?.height }, key);
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

  router.get('/content/locales', requireAdminAuth, validateQuery(emptyQuerySchema), async (_request, response) => {
    try {
      response.json({ locales: await supportedLocales() });
    } catch (error) {
      handleError(response, error);
    }
  });

  async function handlePreferenceList(kind: PreferenceKind, request: Request, response: Response) {
    const query = validatedQuery<AdminLocalizedQuery>(request);
    const locale = normalizeLocale(query.lang) || parseAcceptLanguage(request.header('accept-language')) || 'de';
    response.json({ items: await listPreferences(kind, locale) });
  }

  router.get('/relationship-modes', requireAdminAuth, validateQuery(adminLocalizedQuerySchema), async (request, response) => {
    try {
      await handlePreferenceList('relationshipModes', request, response);
    } catch (error) {
      handleError(response, error);
    }
  });

  async function handlePreferenceSave(
    kind: PreferenceKind,
    resourceType: 'relationship-mode' | 'content-style',
    action: 'create' | 'update',
    request: Request,
    response: Response,
    id?: string,
  ) {
    const result = await savePreference(kind, request.body, id);
    if (result.status === 'notFound') {
      sendAdminError(response, 404, 'admin.preferenceNotFound', 'Taxonomy not found.');
      return;
    }
    if (result.status === 'exists') {
      sendAdminError(response, 409, 'admin.preferenceExists', 'Taxonomy value already exists.');
      return;
    }
    if (result.status === 'defaultTranslationMissing') {
      sendDefaultTranslationMissingError(response);
      return;
    }
    if (result.status === 'invalid' || !result.id) {
      sendAdminError(response, 400, 'admin.preferenceInvalid', 'Taxonomy data is invalid.');
      return;
    }

    await audit(action, resourceType, result.id, { value: request.body.value });
    const payload = { id: result.id, items: await listPreferences(kind) };
    if (action === 'create') {
      response.status(201).json(payload);
      return;
    }
    response.json(payload);
  }

  router.post('/relationship-modes', requireAdminAuth, validateQuery(emptyQuerySchema), validateBody(preferenceBodySchema), async (request, response) => {
    try {
      await handlePreferenceSave('relationshipModes', 'relationship-mode', 'create', request, response);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.patch('/relationship-modes/:id', requireAdminAuth, validateQuery(emptyQuerySchema), validateBody(preferenceBodySchema), async (request, response) => {
    try {
      await handlePreferenceSave('relationshipModes', 'relationship-mode', 'update', request, response, String(request.params.id));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/content-styles', requireAdminAuth, validateQuery(adminLocalizedQuerySchema), async (request, response) => {
    try {
      await handlePreferenceList('contentStyles', request, response);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/content-styles', requireAdminAuth, validateQuery(emptyQuerySchema), validateBody(preferenceBodySchema), async (request, response) => {
    try {
      await handlePreferenceSave('contentStyles', 'content-style', 'create', request, response);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.patch('/content-styles/:id', requireAdminAuth, validateQuery(emptyQuerySchema), validateBody(preferenceBodySchema), async (request, response) => {
    try {
      await handlePreferenceSave('contentStyles', 'content-style', 'update', request, response, String(request.params.id));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/categories', requireAdminAuth, validateQuery(adminCategoriesQuerySchema), async (request, response) => {
    try {
      const query = validatedQuery<AdminCategoriesQuery>(request);
      const type = normalizeText(query.type);
      const locale = normalizeLocale(query.lang) || parseAcceptLanguage(request.header('accept-language')) || 'de';
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
    } catch (error) {
      if (error instanceof Error && error.message === defaultTranslationMissingMessage) {
        sendDefaultTranslationMissingError(response);
        return;
      }
      sendAdminError(response, 400, 'admin.categoryInvalid', 'Category data is invalid.');
    }
  });

  router.patch('/categories/:id', requireAdminAuth, validateBody(categoryBodySchema), async (request, response) => {
    try {
      const id = await saveCategory(request.body, String(request.params.id));
      await audit('update', 'category', id, { contentType: request.body.contentType, value: request.body.value });
      response.json({ id, items: await listCategories() });
    } catch (error) {
      if (error instanceof Error && error.message === defaultTranslationMissingMessage) {
        sendDefaultTranslationMissingError(response);
        return;
      }
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

  router.get('/content/:type', requireAdminAuth, validateQuery(adminContentListQuerySchema), async (request, response) => {
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

  router.post('/content/:type', requireAdminAuth, validateQuery(adminContentListQuerySchema), validateEditableContentBody, async (request, response) => {
    try {
      const type = String(request.params.type);
      if (!isEditableContentType(type)) {
        sendAdminError(response, 404, 'content.notFound', 'Content type not found.');
        return;
      }
      const id = await saveContent(type, request.body);
      await audit('create', type, id, { fields: Object.keys(request.body ?? {}) });
      response.status(201).json({ id, items: await listContent(type, request) });
    } catch (_error) {
      sendAdminError(response, 400, 'admin.contentInvalid', 'Content data is invalid.');
    }
  });

  router.patch('/content/:type/:id', requireAdminAuth, validateQuery(adminContentListQuerySchema), validateEditableContentBody, async (request, response) => {
    try {
      const type = String(request.params.type);
      if (!isEditableContentType(type)) {
        sendAdminError(response, 404, 'content.notFound', 'Content type not found.');
        return;
      }
      const id = await saveContent(type, request.body, String(request.params.id));
      await audit('update', type, id, { fields: Object.keys(request.body ?? {}) });
      response.json({ id, items: await listContent(type, request) });
    } catch (_error) {
      sendAdminError(response, 400, 'admin.contentInvalid', 'Content data is invalid.');
    }
  });

  return router;
}



