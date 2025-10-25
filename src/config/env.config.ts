/**
 * Environment Configuration
 * Validates and exports environment variables
 */

import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),

  // Database Configuration
  DATABASE_URL: z.string().default("mongodb://localhost:27017/postengage"),
  REDIS_URL: z.string().optional(),

  // Instagram Configuration
  // Provide sensible development defaults to avoid crashing when .env is incomplete
  INSTAGRAM_APP_ID: z.string().default("dev-instagram-app-id"),
  INSTAGRAM_APP_SECRET: z.string().default("dev-instagram-app-secret"),
  INSTAGRAM_REDIRECT_URI: z
    .string()
    .default("http://localhost:3000/auth/instagram/callback"),

  INSTAGRAM_API_BASE_URL: z.string().default("https://api.instagram.com"),
  INSTAGRAM_API_VERSION: z.string().default("v24.0"),
  INSTAGRAM_GRAPH_API_BASE_URL: z
    .string()
    .default("https://graph.instagram.com"),

  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: z
    .string()
    .default("dev-webhook-verify-token"),

  // Future Social Media Platforms
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  TWITTER_API_KEY: z.string().optional(),
  TWITTER_API_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),

  // Security
  ENCRYPTION_KEY: z
    .string()
    .default(
      "your-encryption-key-must-be-at-least-32-characters-long-for-security"
    ),
  SESSION_SECRET: z
    .string()
    .default("your-super-secret-session-key-change-in-production"),

  // Email Configuration
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false), // true for 465, false for other ports
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("noreply@instagram-automation.com"),
  EMAIL_FROM_NAME: z.string().default("Instagram Automation"),

  // External Services
  WEBHOOK_BASE_URL: z.string().optional(),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  ALLOWED_ORIGINS: z.string().default("http://localhost:3000,http://localhost:3001"),
});

// Validate environment variables
const env = envSchema.parse(process.env);

// In production, warn if any Instagram-related defaults are being used
if (env.NODE_ENV === "production") {
  const defaultsUsed = [
    env.INSTAGRAM_APP_ID === "dev-instagram-app-id",
    env.INSTAGRAM_APP_SECRET === "dev-instagram-app-secret",
    env.INSTAGRAM_REDIRECT_URI ===
      "http://localhost:3000/auth/instagram/callback",
    env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN === "dev-webhook-verify-token",
  ];
  if (defaultsUsed.some(Boolean)) {
    // eslint-disable-next-line no-console
    console.error(
      "Environment validation warning: Instagram credentials appear to be defaults. Please set real values in production."
    );
  }
}

export default env;
