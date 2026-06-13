import type { Response } from 'express';
import { type BackendMessageKey, translateBackend } from './i18n/messages.js';

const apiErrorKeys = [
  'common.unexpected',
  'common.validation',
  'common.rateLimited',
  'auth.missingToken',
  'auth.invalidToken',
  'auth.invalidCredentials',
  'auth.registrationInvalid',
  'auth.emailAlreadyRegistered',
  'profile.updateInvalid',
  'profile.passwordInvalid',
  'couple.alreadyConnected',
  'couple.inviteCodeRequired',
  'couple.inviteCodeNotFound',
  'couple.full',
  'couple.notConnected',
  'couple.accessDenied',
  'today.answerRequired',
  'today.noActiveQuestion',
  'quest.notFound',
  'knowMe.invalidCatalogQuestionId',
  'knowMe.questionInvalid',
  'knowMe.correctOptionInvalid',
  'knowMe.catalogQuestionNotFound',
  'knowMe.catalogQuestionAlreadyUsed',
  'knowMe.selectedOptionInvalid',
  'knowMe.questionNotFound',
  'knowMe.authorCannotGuessOwnQuestion',
  'knowMe.questionAlreadyAnswered',
  'knowMe.optionDoesNotExist',
  'loveJar.noteRequired',
  'loveJar.invalidCategory',
  'loveJar.alreadyDrawnToday',
  'loveJar.noUnreadNote',
  'memory.titleRequired',
  'memory.invalidDate',
  'memory.invalidCategory',
  'garden.objectNotFound',
  'garden.invalidPlacement',
  'notification.notFound',
] as const;

export type ApiErrorKey = (typeof apiErrorKeys)[number];

function backendErrorKey(key: ApiErrorKey): BackendMessageKey {
  return `errors.${key}` as BackendMessageKey;
}

export const apiErrorMessages = Object.fromEntries(
  apiErrorKeys.map((key) => [key, translateBackend(backendErrorKey(key))]),
) as Record<ApiErrorKey, string>;

export function sendApiError(
  response: Response,
  status: number,
  errorKey: ApiErrorKey,
  params?: Record<string, unknown>,
) {
  response.status(status).json({
    errorKey,
    error: translateBackend(backendErrorKey(errorKey), params),
    ...(params ? { params } : {}),
  });
}

export function handleError(response: Response, error: unknown) {
  console.error(error);
  sendApiError(response, 500, 'common.unexpected');
}
