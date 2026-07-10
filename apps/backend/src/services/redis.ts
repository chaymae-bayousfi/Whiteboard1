import IORedis from 'ioredis';
import { config } from '@/config/env';
import { logger } from '@/config/logger';

export const redis = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: false,
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis error');
});

export const pubRedis = redis.duplicate();
export const subRedis = redis.duplicate();

export const CHANNELS = {
  cursors: (boardId: string) => `board:${boardId}:cursors`,
  presence: (boardId: string) => `board:${boardId}:presence`,
} as const;
