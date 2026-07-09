import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { checkDatabase, pool } from './db.js';
import { adminRouter } from './adminRoutes.js';
import { sendApiError } from './errors.js';
import { logger } from './logger.js';
import { apiRouter } from './routes.js';

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
  }),
);
app.use(express.json());
app.use((request, response, next) => {
  const startedAt = Date.now();
  response.on('finish', () => {
    logger.debug('HTTP request completed', {
      method: request.method,
      path: request.path,
      statusCode: response.statusCode,
      durationMs: Date.now() - startedAt,
      hasAuthorizationHeader: Boolean(request.header('authorization')),
      userAgent: request.header('user-agent'),
    });
  });
  next();
});
app.use((error: unknown, request: Request, response: Response, next: NextFunction) => {
  if (request.path.startsWith('/api') && error instanceof SyntaxError) {
    logger.warn('Invalid JSON request body', {
      path: request.path,
      method: request.method,
    });
    sendApiError(response, 400, 'common.validation');
    return;
  }

  next(error);
});

app.use('/api', (_request, response, next) => {
  response.setHeader('Cache-Control', 'no-store');
  next();
});

app.get('/health', async (_request, response) => {
  try {
    const databaseTime = await checkDatabase();
    response.json({
      ok: true,
      service: 'herzgarten-backend',
      database: 'connected',
      databaseTime,
    });
  } catch (error) {
    response.status(503).json({
      ok: false,
      service: 'herzgarten-backend',
      database: 'unavailable',
    });
  }
});

app.use('/api/admin', adminRouter());
app.use('/api', apiRouter());

const uploadDir = path.resolve(config.uploadDir);
app.use('/uploads', express.static(uploadDir, { dotfiles: 'allow' /* Express 5: preserve v4 behavior */ }));

if (config.staticDir) {
  const staticDir = path.resolve(config.staticDir);
  const indexFile = path.join(staticDir, 'index.html');

  if (!existsSync(indexFile)) {
    throw new Error(`Static frontend index not found: ${indexFile}`);
  }

  app.use(express.static(staticDir, { dotfiles: 'allow' /* Express 5: preserve v4 behavior */ }));
  app.get('/{*splat}', (request, response, next) => {
    if (request.path.startsWith('/api')) {
      next();
      return;
    }

    response.sendFile(indexFile, { dotfiles: 'allow' /* Express 5: preserve v4 behavior */ });
  });
}

const server = app.listen(config.port, () => {
  logger.info('Herzgarten backend started', {
    port: config.port,
    nodeEnv: config.nodeEnv,
    logLevel: config.logLevel,
    corsOrigin: config.corsOrigin,
    staticDirConfigured: Boolean(config.staticDir),
    jwtIssuer: config.jwtIssuer,
    userJwtAudience: config.userJwtAudience,
    adminJwtAudience: config.adminJwtAudience,
  });
});

async function shutdown() {
  logger.info('Herzgarten backend shutting down');
  server.close();
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
