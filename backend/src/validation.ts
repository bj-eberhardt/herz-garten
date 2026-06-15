import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { sendApiError } from './errors.js';

export function validateBody<T>(schema: ZodType<T>) {
  return (request: Request, response: Response, next: NextFunction) => {
    const parsed = schema.safeParse(request.body ?? {});
    if (!parsed.success) {
      sendApiError(response, 400, 'common.validation', {
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

export function validateQuery<T>(schema: ZodType<T>) {
  return (request: Request, response: Response, next: NextFunction) => {
    const parsed = schema.safeParse(request.query ?? {});
    if (!parsed.success) {
      sendApiError(response, 400, 'common.validation', {
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
