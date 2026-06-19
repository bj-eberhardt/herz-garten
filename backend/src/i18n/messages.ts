import { pool } from '../db.js';
import { config } from '../config.js';

const de = {
  'errors.common.unexpected': 'Da ist etwas schiefgelaufen. Bitte versuche es gleich noch einmal.',
  'errors.common.validation': 'Bitte prüfe deine Eingaben.',
  'errors.common.rateLimited': 'Zu viele Versuche. Bitte warte einen Moment und versuche es dann erneut.',
  'errors.auth.missingToken': 'Deine Sitzung fehlt. Bitte logge dich erneut ein.',
  'errors.auth.invalidToken': 'Deine Sitzung ist abgelaufen. Bitte logge dich erneut ein.',
  'errors.auth.invalidCredentials': 'E-Mail oder Passwort stimmt nicht.',
  'errors.auth.registrationInvalid': 'Bitte gib E-Mail, Namen und ein Passwort mit mindestens 8 Zeichen ein.',
  'errors.auth.emailAlreadyRegistered': 'Diese E-Mail ist schon registriert.',
  'errors.profile.updateInvalid': 'Bitte gib einen Namen und eine gültige E-Mail-Adresse ein.',
  'errors.profile.passwordInvalid': 'Das aktuelle Passwort stimmt nicht.',
  'errors.couple.alreadyConnected': 'Du bist bereits mit einem Paarraum verbunden.',
  'errors.couple.inviteCodeRequired': 'Bitte gib einen Paar-Code ein.',
  'errors.couple.inviteCodeNotFound': 'Diesen Paar-Code konnten wir nicht finden. Bitte prüfe den Code noch einmal.',
  'errors.couple.full': 'Dieser Paarraum hat bereits zwei Mitglieder.',
  'errors.couple.notConnected': 'Du bist noch mit keinem Paarraum verbunden.',
  'errors.couple.accessDenied': 'Du hast keinen Zugriff auf diesen Paarraum.',
  'errors.today.answerRequired': 'Bitte schreibe zuerst eine Antwort.',
  'errors.today.noActiveQuestion': 'Gerade ist keine aktive Tagesfrage verfügbar.',
  'errors.quest.notFound': 'Diese Aufgabe konnten wir nicht finden.',
  'errors.knowMe.invalidCatalogQuestionId': 'Der ausgewählte Fragenvorschlag ist ungültig.',
  'errors.knowMe.questionInvalid': 'Bitte schreibe eine Frage und mindestens zwei Antwortmöglichkeiten.',
  'errors.knowMe.correctOptionInvalid': 'Bitte wähle eine gültige richtige Antwort.',
  'errors.knowMe.catalogQuestionNotFound': 'Diesen Fragenvorschlag konnten wir nicht finden.',
  'errors.knowMe.catalogQuestionAlreadyUsed': 'Diesen Fragenvorschlag hast du schon gestellt.',
  'errors.knowMe.selectedOptionInvalid': 'Bitte wähle eine gültige Antwort.',
  'errors.knowMe.questionNotFound': 'Diese Kennst-du-mich-Frage konnten wir nicht finden.',
  'errors.knowMe.authorCannotGuessOwnQuestion': 'Diese Frage hast du selbst erstellt. Dein Partner darf raten.',
  'errors.knowMe.questionAlreadyAnswered': 'Diese Frage wurde bereits beantwortet.',
  'errors.knowMe.optionDoesNotExist': 'Diese Antwortmöglichkeit gibt es nicht.',
  'errors.loveJar.noteRequired': 'Bitte schreibe zuerst einen Zettel.',
  'errors.loveJar.invalidCategory': 'Diese Zettel-Kategorie gibt es nicht.',
  'errors.loveJar.alreadyDrawnToday': 'Du hast heute schon einen Zettel gezogen. Morgen wartet wieder einer auf dich.',
  'errors.loveJar.noUnreadNote': 'Gerade ist kein ungelesener Zettel im Glas. Schreibt euch neue kleine Botschaften.',
  'errors.memory.titleRequired': 'Bitte gib der Erinnerung einen Titel.',
  'errors.memory.invalidDate': 'Bitte wähle ein gültiges Datum.',
  'errors.memory.invalidCategory': 'Diese Erinnerungs-Kategorie gibt es nicht.',
  'errors.garden.objectNotFound': 'Dieses Gartenobjekt konnten wir nicht finden.',
  'errors.garden.invalidPlacement': 'Diese Gartenposition ist nicht verfügbar.',
  'errors.notification.notFound': 'Diese Benachrichtigung konnten wir nicht finden.',
} as const;

const messages = {
  de,
} as const;

export type BackendLocale = keyof typeof messages;
export type BackendMessageKey = keyof typeof de;
export type NotificationMessageKey = Extract<BackendMessageKey, `notifications.${string}`>;

interface MessageTemplateTranslationRow {
  text: string;
}

export function translateBackend(
  key: BackendMessageKey,
  params: Record<string, unknown> = {},
  locale: BackendLocale = 'de',
) {
  const template = messages[locale]?.[key] ?? messages.de[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, paramName: string) => {
    const value = params[paramName];
    return value === undefined || value === null ? match : String(value);
  });
}

export function renderTemplate(template: string, params: Record<string, unknown> = {}) {
  return template.replace(/\{(\w+)\}/g, (match, paramName: string) => {
    const value = params[paramName];
    return value === undefined || value === null ? match : String(value);
  });
}

export async function translateNotificationBackend(
  key: NotificationMessageKey,
  params: Record<string, unknown> = {},
  locale: BackendLocale = 'de',
) {
  const result = await pool.query<MessageTemplateTranslationRow>(
    `
      select coalesce(requested.text, fallback.text) as text
      from message_templates template
      left join message_template_translations requested
        on requested.template_key = template.key and requested.locale = $2
      left join message_template_translations fallback
        on fallback.template_key = template.key and fallback.locale = $3
      where template.key = $1 and template.active = true
      limit 1
    `,
    [key, locale, config.i18nDefaultLocale],
  );
  const template = result.rows[0]?.text;
  return template ? renderTemplate(template, params) : translateBackend(key, params, locale);
}
