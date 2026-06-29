import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { sendApiError, type ApiErrorKey } from './errors.js';

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: unknown;
    }
  }
}

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

    request.validatedQuery = parsed.data;
    next();
  };
}

export function validatedQuery<T>(request: Request): T {
  if (request.validatedQuery === undefined) {
    throw new Error('Validated query is not available. Did this route run validateQuery first?');
  }
  return request.validatedQuery as T;
}

