import { config } from '../../config.js';
import { findNotificationMessageTemplateText } from './notifications.repository.js';

export const notificationMessageKeys = [
  'notifications.titles.dailyAnswerWaiting',
  'notifications.titles.dailyRevealed',
  'notifications.titles.questWaitingConfirmation',
  'notifications.titles.questCompleted',
  'notifications.titles.loveJarNote',
  'notifications.titles.memoryCreated',
  'notifications.titles.knowMeQuestion',
  'notifications.titles.knowMeAnsweredHit',
  'notifications.titles.knowMeAnsweredMiss',
  'notifications.titles.coupleDisconnected',
  'notifications.titles.coupleJoined',
  'notifications.bodies.dailyAnswerWaiting',
  'notifications.bodies.dailyRevealed',
  'notifications.bodies.questWaitingConfirmation',
  'notifications.bodies.questCompleted',
  'notifications.bodies.loveJarNote',
  'notifications.bodies.memoryCreated',
  'notifications.bodies.knowMeQuestion',
  'notifications.bodies.knowMeAnsweredHit',
  'notifications.bodies.knowMeAnsweredMiss',
  'notifications.bodies.coupleDisconnected',
  'notifications.bodies.coupleJoined',
] as const;

export type NotificationMessageKey = (typeof notificationMessageKeys)[number];
export type PushMessageKey = `push.${string}`;

export function renderTemplate(template: string, params: Record<string, unknown> = {}) {
  return template.replace(/\{(\w+)\}/g, (match, paramName: string) => {
    const value = params[paramName];
    return value === undefined || value === null ? match : String(value);
  });
}

export async function translateNotificationBackend(
  key: NotificationMessageKey,
  params: Record<string, unknown> = {},
  locale = config.i18nDefaultLocale,
) {
  const template = await findNotificationMessageTemplateText(key, locale, config.i18nDefaultLocale);
  if (template) return renderTemplate(template, params);

  console.warn(`Notification message template missing: ${key}`);
  return renderTemplate(key, params);
}

export async function translatePushBackend(
  key: PushMessageKey,
  params: Record<string, unknown> = {},
  locale = config.i18nDefaultLocale,
) {
  const template = await findNotificationMessageTemplateText(key, locale, config.i18nDefaultLocale);
  if (template) return renderTemplate(template, params);

  const notificationFallbackKey = key.replace(/^push\./, 'notifications.') as NotificationMessageKey;
  const fallback = await findNotificationMessageTemplateText(notificationFallbackKey, locale, config.i18nDefaultLocale);
  if (fallback) return renderTemplate(fallback, params);

  console.warn(`Push message template missing: ${key}`);
  return renderTemplate(key, params);
}

export function pushMessageKeyForNotification(key: NotificationMessageKey): PushMessageKey {
  return key.replace(/^notifications\./, 'push.') as PushMessageKey;
}
