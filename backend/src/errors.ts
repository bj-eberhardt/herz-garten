import type { Response } from 'express';

export const apiErrorMessages = {
  'common.unexpected': 'Da ist etwas schiefgelaufen. Bitte versuche es gleich noch einmal.',
  'auth.missingToken': 'Deine Sitzung fehlt. Bitte logge dich erneut ein.',
  'auth.invalidToken': 'Deine Sitzung ist abgelaufen. Bitte logge dich erneut ein.',
  'auth.invalidCredentials': 'E-Mail oder Passwort stimmt nicht.',
  'auth.registrationInvalid': 'Bitte gib E-Mail, Namen und ein Passwort mit mindestens 8 Zeichen ein.',
  'auth.emailAlreadyRegistered': 'Diese E-Mail ist schon registriert.',
  'couple.alreadyConnected': 'Du bist bereits mit einem Paarraum verbunden.',
  'couple.inviteCodeRequired': 'Bitte gib einen Paar-Code ein.',
  'couple.inviteCodeNotFound': 'Diesen Paar-Code konnten wir nicht finden. Bitte prüfe den Code noch einmal.',
  'couple.full': 'Dieser Paarraum hat bereits zwei Mitglieder.',
  'couple.notConnected': 'Du bist noch mit keinem Paarraum verbunden.',
  'couple.accessDenied': 'Du hast keinen Zugriff auf diesen Paarraum.',
  'today.answerRequired': 'Bitte schreibe zuerst eine Antwort.',
  'today.noActiveQuestion': 'Gerade ist keine aktive Tagesfrage verfügbar.',
  'quest.notFound': 'Diese Quest konnten wir nicht finden.',
  'knowMe.invalidCatalogQuestionId': 'Der ausgewählte Fragenvorschlag ist ungültig.',
  'knowMe.questionInvalid': 'Bitte schreibe eine Frage und mindestens zwei Antwortmöglichkeiten.',
  'knowMe.correctOptionInvalid': 'Bitte wähle eine gültige richtige Antwort.',
  'knowMe.catalogQuestionNotFound': 'Diesen Fragenvorschlag konnten wir nicht finden.',
  'knowMe.catalogQuestionAlreadyUsed': 'Diesen Fragenvorschlag hast du schon gestellt.',
  'knowMe.selectedOptionInvalid': 'Bitte wähle eine gültige Antwort.',
  'knowMe.questionNotFound': 'Diese Kennst-du-mich-Frage konnten wir nicht finden.',
  'knowMe.authorCannotGuessOwnQuestion': 'Diese Frage hast du selbst erstellt. Dein Partner darf raten.',
  'knowMe.questionAlreadyAnswered': 'Diese Frage wurde bereits beantwortet.',
  'knowMe.optionDoesNotExist': 'Diese Antwortmöglichkeit gibt es nicht.',
  'loveJar.noteRequired': 'Bitte schreibe zuerst einen Zettel.',
  'loveJar.invalidCategory': 'Diese Zettel-Kategorie gibt es nicht.',
  'loveJar.alreadyDrawnToday': 'Du hast heute schon einen Zettel gezogen. Morgen wartet wieder einer auf dich.',
  'loveJar.noUnreadNote': 'Gerade ist kein ungelesener Zettel im Glas. Schreibt euch neue kleine Botschaften.',
  'memory.titleRequired': 'Bitte gib der Erinnerung einen Titel.',
  'memory.invalidDate': 'Bitte wähle ein gültiges Datum.',
  'memory.invalidCategory': 'Diese Erinnerungs-Kategorie gibt es nicht.',
  'garden.objectNotFound': 'Dieses Gartenobjekt konnten wir nicht finden.',
  'garden.invalidPlacement': 'Diese Gartenposition ist nicht verfuegbar.',
  'notification.notFound': 'Diese Benachrichtigung konnten wir nicht finden.',
} as const;

export type ApiErrorKey = keyof typeof apiErrorMessages;

export function sendApiError(
  response: Response,
  status: number,
  errorKey: ApiErrorKey,
  params?: Record<string, unknown>,
) {
  response.status(status).json({
    errorKey,
    error: apiErrorMessages[errorKey],
    ...(params ? { params } : {}),
  });
}

export function handleError(response: Response, error: unknown) {
  console.error(error);
  sendApiError(response, 500, 'common.unexpected');
}
