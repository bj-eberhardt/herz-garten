import type { Response } from 'express';
import { errorMetadata, logger } from './logger.js';

const apiErrorKeys = [
  'common.unexpected',
  'common.validation',
  'common.rateLimited',
  'rejected',
  'auth.missingToken',
  'auth.invalidToken',
  'auth.invalidCredentials',
  'auth.registrationInvalid',
  'auth.emailAlreadyRegistered',
  'auth.resetTokenInvalid',
  'auth.resetRequestLimited',
  'email.configurationInvalid',
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

export function sendApiError(
  response: Response,
  status: number,
  errorKey: ApiErrorKey,
  params?: Record<string, unknown>,
) {
  response.status(status).json({
    errorKey,
    errorCode: errorKey,
    error: errorKey,
    ...(params ? { params } : {}),
  });
}

export function handleError(response: Response, error: unknown) {
  logger.error('Unhandled API error', errorMetadata(error));
  sendApiError(response, 500, 'common.unexpected');
}
