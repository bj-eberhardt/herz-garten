import {
  findMessageTemplate,
  listMessageTemplates as listMessageTemplateRecords,
  replaceMessageTemplateTranslations,
} from './messageTemplates.repository.js';
import { normalizeLocale, supportedLocales } from '../support.repository.js';

export interface MessageTemplateSaveBody {
  translations?: Record<string, { text?: unknown }>;
}

export interface MessageTemplateValidationError {
  locale: string;
  message: string;
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

export async function listMessageTemplates(namespace = 'notifications') {
  return listMessageTemplateRecords(namespace);
}

export async function saveMessageTemplate(key: string, body: MessageTemplateSaveBody) {
  const template = await findMessageTemplate(key);
  if (!template || template.namespace !== 'notifications') {
    return { status: 'notFound' as const };
  }

  const activeLocales = (await supportedLocales()).filter((locale) => locale.active);
  const activeLocaleCodes = new Set(activeLocales.map((locale) => locale.locale));
  const translations = body.translations ?? {};
  const errors: MessageTemplateValidationError[] = [];
  const normalizedTranslations: Array<{ locale: string; text: string }> = [];

  for (const [rawLocale, translation] of Object.entries(translations)) {
    const locale = normalizeLocale(rawLocale);
    if (!locale || !activeLocaleCodes.has(locale)) continue;

    const text = typeof translation.text === 'string' ? translation.text.trim() : '';
    if (!text && locale !== 'de') continue;

    if (!text && locale === 'de') {
      errors.push({ locale, message: 'Die Default-Übersetzung darf nicht leer sein.' });
      continue;
    }

    const placeholders = extractPlaceholders(text);
    if (!samePlaceholders(placeholders, template.requiredParams)) {
      errors.push({
        locale,
        message: `Erwartete Platzhalter: ${template.requiredParams.map((param) => `{${param}}`).join(', ') || 'keine'}.`,
      });
      continue;
    }

    normalizedTranslations.push({ locale, text });
  }

  if (!normalizedTranslations.some((translation) => translation.locale === 'de')) {
    errors.push({ locale: 'de', message: 'Die Default-Übersetzung darf nicht leer sein.' });
  }

  if (errors.length > 0) {
    throw new MessageTemplateValidationException(errors);
  }

  await replaceMessageTemplateTranslations(key, normalizedTranslations);
  return { status: 'saved' as const, items: await listMessageTemplates(template.namespace) };
}
