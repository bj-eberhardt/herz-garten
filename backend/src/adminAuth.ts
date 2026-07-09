import type { NextFunction, Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { getAuthSettings } from './admin/settings.service.js';
import { config } from './config.js';
import { sendApiError } from './errors.js';
import { errorMetadata, logger } from './logger.js';

interface AdminJwtPayload {
  sub: string;
  type?: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: { id: 'admin' };
    }
  }
}

export async function signAdminToken() {
  const { adminJwtTtlMinutes } = await getAuthSettings();
  const options: SignOptions = {
    subject: 'admin',
    issuer: config.jwtIssuer,
    audience: config.adminJwtAudience,
    expiresIn: adminJwtTtlMinutes * 60,
  };

  return jwt.sign({ type: 'admin' }, config.adminJwtSecret, {
    ...options,
  });
}

export function requireAdminAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    logger.warn('Admin auth rejected: missing bearer token', {
      path: request.path,
      method: request.method,
      hasAuthorizationHeader: Boolean(header),
    });
    sendApiError(response, 401, 'auth.missingToken');
    return;
  }

  try {
    const payload = jwt.verify(token, config.adminJwtSecret, {
      issuer: config.jwtIssuer,
      audience: config.adminJwtAudience,
    }) as AdminJwtPayload;
    if (payload.sub !== 'admin' || payload.type !== 'admin') {
      logger.warn('Admin auth rejected: invalid token payload', {
        path: request.path,
        method: request.method,
        subject: payload.sub,
        type: payload.type,
      });
      sendApiError(response, 401, 'auth.invalidToken');
      return;
    }

    logger.debug('Admin auth accepted', {
      path: request.path,
      method: request.method,
    });
    request.admin = { id: 'admin' };
    next();
  } catch (error) {
    logger.warn('Admin auth rejected: JWT verification failed', {
      path: request.path,
      method: request.method,
      ...errorMetadata(error),
    });
    sendApiError(response, 401, 'auth.invalidToken');
  }
}
