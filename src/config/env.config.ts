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
  PORT: z.string().transform(Number).default('3000'),
  
  // Database Configuration
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  
  // Instagram Configuration
  INSTAGRAM_APP_ID: z.string(),
  INSTAGRAM_APP_SECRET: z.string(),
  INSTAGRAM_REDIRECT_URI: z.string(),
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: z.string(),
  
  // Future Social Media Platforms
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  TWITTER_API_KEY: z.string().optional(),
  TWITTER_API_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  
  // Security
  JWT_SECRET: z.string().default('your-super-secret-jwt-key'),
  ENCRYPTION_KEY: z.string().default('your-encryption-key'),
  
  // External Services
  WEBHOOK_BASE_URL: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Validate environment variables
const env = envSchema.parse(process.env);

export default env;