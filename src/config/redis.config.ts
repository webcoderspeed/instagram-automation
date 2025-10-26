/**
 * Redis Configuration
 * Redis connection and caching configuration
 */

import env from './env.config';

export interface RedisConfig {
  url?: string;
  host: string;
  port: number;
  password?: string;
  db: number;
  retryDelayOnFailover: number;
  enableReadyCheck: boolean;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  keyPrefix: string;
  ttl: {
    default: number;
    session: number;
    cache: number;
    rateLimit: number;
  };
}

const redisConfig: RedisConfig = {
  url: env.REDIS_URL,
  host: env.REDIS_URL ? '' : 'localhost',
  port: env.REDIS_URL ? 0 : 6379,
  password: undefined,
  db: 0,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keyPrefix: 'social_media_saas:',
  ttl: {
    default: 3600, // 1 hour
    session: 86400, // 24 hours
    cache: 1800, // 30 minutes
    rateLimit: 900, // 15 minutes
  },
};

export default redisConfig;