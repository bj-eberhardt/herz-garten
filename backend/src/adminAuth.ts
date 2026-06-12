import type { NextFunction, Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from './config.js';
import { sendApiError } from './errors.js';

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

export function signAdminToken() {
  const options: SignOptions = {
    subject: 'admin',
    issuer: config.jwtIssuer,
    audience: config.adminJwtAudience,
    expiresIn: config.adminTokenTtl as SignOptions['expiresIn'],
  };

  return jwt.sign({ type: 'admin' }, config.adminJwtSecret, {
    ...options,
  });
}

export function requireAdminAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    sendApiError(response, 401, 'auth.missingToken');
    return;
  }

  try {
    const payload = jwt.verify(token, config.adminJwtSecret, {
      issuer: config.jwtIssuer,
      audience: config.adminJwtAudience,
    }) as AdminJwtPayload;
    if (payload.sub !== 'admin' || payload.type !== 'admin') {
      sendApiError(response, 401, 'auth.invalidToken');
      return;
    }

    request.admin = { id: 'admin' };
    next();
  } catch {
    sendApiError(response, 401, 'auth.invalidToken');
  }
}
