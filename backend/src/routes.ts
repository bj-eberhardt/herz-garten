import type { Router } from 'express';
import { Router as createRouter } from 'express';
import { registerAccountRoutes } from './api/routes/account.js';
import { registerAuthRoutes } from './api/routes/auth.js';
import { registerCoupleRoutes } from './api/routes/couples.js';
import { registerGardenRoutes } from './api/routes/garden.js';
import { registerKnowMeRoutes } from './api/routes/know-me.js';
import { registerLoveJarRoutes } from './api/routes/love-jar.js';
import { registerMemoryRoutes } from './api/routes/memories.js';
import { registerNotificationRoutes } from './api/routes/notifications.js';
import { registerQuestRoutes } from './api/routes/quests.js';
import { registerTodayRoutes } from './api/routes/today.js';

export function apiRouter(): Router {
  const router = createRouter();

  registerAuthRoutes(router);
  registerAccountRoutes(router);
  registerNotificationRoutes(router);
  registerCoupleRoutes(router);
  registerTodayRoutes(router);
  registerQuestRoutes(router);
  registerKnowMeRoutes(router);
  registerLoveJarRoutes(router);
  registerMemoryRoutes(router);
  registerGardenRoutes(router);

  return router;
}

