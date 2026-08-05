import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ROUTES } from './utils/constants/routes.js';
import { generalLimiter } from './services/rate-limit/index.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import propertiesRoutes from './modules/properties/properties.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import bookingsRoutes from './modules/bookings/bookings.routes.js';
import listerRoutes from './modules/lister/lister.routes.js';
import leadsRoutes from './modules/leads/leads.routes.js';
import demoRoutes from './modules/demo/demo.routes.js';
import { sendSuccess } from './utils/helpers/response.js';
import { requestLogger } from './middleware/requestLogger.js';
import { createLogger } from './utils/helpers/logger.js';

process.env.TZ = env.TZ;

const logger = createLogger('Server');
const app = express();

app.use(helmet());

const allowedOrigins = Array.from(
  new Set([env.APP_URL, ...env.CORS_ORIGINS]),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);
app.use(generalLimiter);

app.get(ROUTES.HEALTH, (_req, res) => {
  sendSuccess(res, 'OK', { status: 'healthy', timezone: env.TZ });
});

app.use(ROUTES.AUTH.BASE, authRoutes);
app.use(ROUTES.USERS.BASE, usersRoutes);
app.use(ROUTES.PROPERTIES.BASE, propertiesRoutes);
app.use(ROUTES.CHAT.BASE, chatRoutes);
app.use(ROUTES.BOOKINGS.BASE, bookingsRoutes);
app.use(ROUTES.LISTER.BASE, listerRoutes);
app.use(ROUTES.LEADS.BASE, leadsRoutes);
app.use(ROUTES.DEMO.BASE, demoRoutes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`Viewings chat API running on ${env.API_URL} (port ${env.PORT})`);
  logger.info(`Request logging enabled (NODE_ENV=${env.NODE_ENV})`);
});

export default app;
