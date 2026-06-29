import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { checkDatabase, pool } from './db.js';
import { adminRouter } from './adminRoutes.js';
import { sendApiError } from './errors.js';
import { apiRouter } from './routes.js';

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
  }),
);
app.use(express.json());
app.use((error: unknown, request: Request, response: Response, next: NextFunction) => {
  if (request.path.startsWith('/api') && error instanceof SyntaxError) {
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
app.use('/uploads', express.static(uploadDir));

if (config.staticDir) {
  const staticDir = path.resolve(config.staticDir);
  const indexFile = path.join(staticDir, 'index.html');

  if (!existsSync(indexFile)) {
    throw new Error(`Static frontend index not found: ${indexFile}`);
  }

  app.use(express.static(staticDir));
  app.get('/{*splat}', (request, response, next) => {
    if (request.path.startsWith('/api')) {
      next();
      return;
    }

    response.sendFile(indexFile);
  });
}

const server = app.listen(config.port, () => {
  console.log(`Herzgarten backend listening on port ${config.port}`);
});

async function shutdown() {
  server.close();
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
