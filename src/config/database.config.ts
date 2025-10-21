/**
 * Database Configuration
 * Configures database connections and settings
 */

import env from './env.config';

export interface DatabaseConfig {
  url?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
  pool?: {
    min: number;
    max: number;
    idle: number;
  };
}

const databaseConfig: DatabaseConfig = {
  url: env.DATABASE_URL,
  host: env.DATABASE_URL ? undefined : 'localhost',
  port: env.DATABASE_URL ? undefined : 5432,
  username: env.DATABASE_URL ? undefined : 'postgres',
  password: env.DATABASE_URL ? undefined : 'password',
  database: env.DATABASE_URL ? undefined : 'social_media_saas',
  ssl: env.NODE_ENV === 'production',
  pool: {
    min: 2,
    max: 10,
    idle: 30000,
  },
};

export default databaseConfig;