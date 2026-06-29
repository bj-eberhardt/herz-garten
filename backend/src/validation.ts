import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { sendApiError, type ApiErrorKey } from './errors.js';

export function validateBody<T>(schema: ZodType<T>, errorKey: ApiErrorKey = 'common.validation') {
  return (request: Request, response: Response, next: NextFunction) => {
    const parsed = schema.safeParse(request.body === undefined ? {} : request.body);
    if (!parsed.success) {
      sendApiError(response, 400, errorKey, {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    request.body = parsed.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodType<T>, errorKey: ApiErrorKey = 'common.validation') {
  return (request: Request, response: Response, next: NextFunction) => {
    const parsed = schema.safeParse(request.query ?? {});
    if (!parsed.success) {
      sendApiError(response, 400, errorKey, {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    request.query = parsed.data as Request['query'];
    next();
  };
}
