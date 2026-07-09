import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getAuthSettings } from './admin/settings.service.js';
import { config } from './config.js';
import { pool } from './db.js';
import { sendApiError } from './errors.js';
import { errorMetadata, logger } from './logger.js';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface JwtPayload {
  sub: string;
}

export async function signToken(userId: string) {
  const { userJwtTtlMinutes } = await getAuthSettings();
  return jwt.sign({}, config.jwtSecret, {
    subject: userId,
    issuer: config.jwtIssuer,
    audience: config.userJwtAudience,
    expiresIn: userJwtTtlMinutes * 60,
  });
}

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    logger.warn('Auth rejected: missing bearer token', {
      path: request.path,
      method: request.method,
      hasAuthorizationHeader: Boolean(header),
    });
    sendApiError(response, 401, 'auth.missingToken');
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      issuer: config.jwtIssuer,
      audience: config.userJwtAudience,
    }) as JwtPayload;
    const result = await pool.query<AuthUser>(
      `
        select id, email, display_name as "displayName"
        from profiles
        where id = $1
      `,
      [payload.sub],
    );

    const user = result.rows[0];
    if (!user) {
      logger.warn('Auth rejected: token subject not found', {
        path: request.path,
        method: request.method,
        subject: payload.sub,
      });
      sendApiError(response, 401, 'auth.invalidToken');
      return;
    }

    logger.debug('Auth accepted', {
      path: request.path,
      method: request.method,
      userId: user.id,
    });
    request.user = user;
    next();
  } catch (error) {
    logger.warn('Auth rejected: JWT verification failed', {
      path: request.path,
      method: request.method,
      ...errorMetadata(error),
    });
    sendApiError(response, 401, 'auth.invalidToken');
  }
}

export function currentUser(request: Request) {
  if (!request.user) {
    throw new Error('Authenticated route used without user');
  }

  return request.user;
}
