import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { checkDatabase, pool } from './db.js';
import { apiRouter } from './routes.js';

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
  }),
);
app.use(express.json());

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

app.use('/api', apiRouter());

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
