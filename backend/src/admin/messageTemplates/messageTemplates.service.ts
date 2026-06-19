import {
  findMessageTemplate,
  listMessageTemplates as listMessageTemplateRecords,
  replaceMessageTemplateTranslations,
} from './messageTemplates.repository.js';
import { config } from '../../config.js';
import { normalizeLocale, supportedLocales } from '../support.repository.js';

export interface MessageTemplateSaveBody {
  translations?: Record<string, { text?: unknown; description?: unknown }>;
}

export interface MessageTemplateValidationError {
  locale: string;
  errorCode:
    | 'admin.messageTemplate.defaultTranslationRequired'
    | 'admin.messageTemplate.defaultDescriptionRequired'
    | 'admin.messageTemplate.placeholderMismatch';
  params?: Record<string, unknown>;
}

export class MessageTemplateValidationException extends Error {
  constructor(public readonly errors: MessageTemplateValidationError[]) {
    super('Invalid message template translations');
  }
}

const placeholderPattern = /\{(\w+)\}/g;

export function extractPlaceholders(text: string) {
  return [...new Set([...text.matchAll(placeholderPattern)].map((match) => match[1]))].sort();
}

function samePlaceholders(found: string[], required: string[]) {
  const expected = [...required].sort();
  return found.length === expected.length && found.every((placeholder, index) => placeholder === expected[index]);
}

export async function listMessageTemplates(namespace = 'notifications', locale = config.i18nDefaultLocale) {
  return listMessageTemplateRecords(namespace, locale);
}

export async function saveMessageTemplate(key: string, body: MessageTemplateSaveBody, responseLocale = config.i18nDefaultLocale) {
  const template = await findMessageTemplate(key);
  if (!template || template.namespace !== 'notifications') {
    return { status: 'notFound' as const };
  }

  const activeLocales = (await supportedLocales()).filter((locale) => locale.active);
  const activeLocaleCodes = new Set(activeLocales.map((locale) => locale.locale));
  const currentTemplate = (await listMessageTemplateRecords(template.namespace, responseLocale)).find((item) => item.key === key);
  const currentTranslations = currentTemplate?.translations ?? {};
  const translations = body.translations ?? {};
  const errors: MessageTemplateValidationError[] = [];
  const defaultLocale = config.i18nDefaultLocale;
  const normalizedTranslations: Array<{ locale: string; text: string; description: string }> = [];

  for (const locale of activeLocaleCodes) {
    const rawTranslation = translations[locale];
    const currentTranslation = currentTranslations[locale];
    const text =
      rawTranslation && typeof rawTranslation.text === 'string'
        ? rawTranslation.text.trim()
        : (currentTranslation?.text ?? '').trim();
    const description =
      rawTranslation && typeof rawTranslation.description === 'string'
        ? rawTranslation.description.trim()
        : (currentTranslation?.description ?? '').trim();
    if (!text && !description && locale !== defaultLocale) continue;

    if (!text && locale === defaultLocale) {
      errors.push({ locale, errorCode: 'admin.messageTemplate.defaultTranslationRequired' });
      continue;
    }
    if (!description && locale === defaultLocale) {
      errors.push({ locale, errorCode: 'admin.messageTemplate.defaultDescriptionRequired' });
      continue;
    }

    const placeholders = extractPlaceholders(text);
    if (!samePlaceholders(placeholders, template.requiredParams)) {
      errors.push({
        locale,
        errorCode: 'admin.messageTemplate.placeholderMismatch',
        params: { expectedPlaceholders: template.requiredParams },
      });
      continue;
    }

    normalizedTranslations.push({ locale, text, description });
  }

  if (!normalizedTranslations.some((translation) => translation.locale === defaultLocale)) {
    errors.push({ locale: defaultLocale, errorCode: 'admin.messageTemplate.defaultTranslationRequired' });
  }

  if (errors.length > 0) {
    throw new MessageTemplateValidationException(errors);
  }

  await replaceMessageTemplateTranslations(key, normalizedTranslations);
  return { status: 'saved' as const, items: await listMessageTemplates(template.namespace, responseLocale) };
}
