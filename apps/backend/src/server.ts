import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from '@/config/env';
import { logger } from '@/config/logger';
import { authRoutes } from '@/routes/authRoutes';
import { boardRoutes } from '@/routes/boardRoutes';
import { startYjsServer } from '@/ws/yjsServer';
import { ensureBucket } from '@/services/minio';
import { prisma } from '@/config/prisma';

async function start() {
  const app = Fastify({
    logger: false,
    bodyLimit: 10 * 1024 * 1024,
  trustProxy: true,
  ajv: {
      customOptions: {
        removeAdditional: true,
        useDefaults: true,
        coerceTypes: true,
      },
    },
  });

  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  // CORS
  await app.register(cors, {
    origin: [config.clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => {
      return req.headers.authorization ?? req.ip;
    },
  });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API routes
  await app.register(
    async (api) => {
      await api.register(authRoutes);
      await api.register(boardRoutes);
    },
    { prefix: '/api/v1' },
  );

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    logger.error({ err: error, url: request.url }, 'Unhandled error');
    const statusCode = error.statusCode ?? 500;
    reply.code(statusCode).send({
      error: error.message ?? 'Internal server error',
    });
  });

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    logger.info(`HTTP server running on port ${config.port}`);
    logger.info(`API base URL: http://localhost:${config.port}/api/v1`);
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }

  // Start Yjs WebSocket server
  startYjsServer();

  // Ensure MinIO bucket exists
  try {
    await ensureBucket();
  } catch (err) {
    logger.warn({ err }, 'MinIO bucket setup failed - snapshots will not work until MinIO is available');
  }

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
