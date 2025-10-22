/**
 * Environment Configuration
 * Validates and exports environment variables
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  
  // Database Configuration
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  
  // Instagram Configuration
  // Provide sensible development defaults to avoid crashing when .env is incomplete
  INSTAGRAM_APP_ID: z.string().default('dev-instagram-app-id'),
  INSTAGRAM_APP_SECRET: z.string().default('dev-instagram-app-secret'),
  INSTAGRAM_REDIRECT_URI: z
    .string()
    .default('http://localhost:3000/auth/instagram/callback'),
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: z.string().default('dev-webhook-verify-token'),
  
  // Future Social Media Platforms
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  TWITTER_API_KEY: z.string().optional(),
  TWITTER_API_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  
  // Security
  ENCRYPTION_KEY: z.string().default('your-encryption-key'),
  
  // External Services
  WEBHOOK_BASE_URL: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Validate environment variables
const env = envSchema.parse(process.env);

// In production, warn if any Instagram-related defaults are being used
if (env.NODE_ENV === 'production') {
  const defaultsUsed = [
    env.INSTAGRAM_APP_ID === 'dev-instagram-app-id',
    env.INSTAGRAM_APP_SECRET === 'dev-instagram-app-secret',
    env.INSTAGRAM_REDIRECT_URI === 'http://localhost:3000/auth/instagram/callback',
    env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN === 'dev-webhook-verify-token',
  ];
  if (defaultsUsed.some(Boolean)) {
    // eslint-disable-next-line no-console
    console.error(
      'Environment validation warning: Instagram credentials appear to be defaults. Please set real values in production.'
    );
  }
}

export default env;