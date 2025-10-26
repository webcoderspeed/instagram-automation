import { z } from 'zod';

// Platform type enum
const PlatformType = z.enum(['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube']);

// Connection status enum
const ConnectionStatus = z.enum(['connected', 'disconnected', 'error', 'pending', 'expired']);

// Connect platform schema
export const connectPlatformSchema = z.object({
  platform: PlatformType,
  redirectUri: z.string().url("Invalid redirect URI").optional(),
  scopes: z.array(z.string()).optional(),
  state: z.string().optional(),
});

// Handle OAuth callback schema
export const handleCallbackSchema = z.object({
  platform: PlatformType,
  code: z.string().min(1, "Authorization code is required"),
  state: z.string().optional(),
  error: z.string().optional(),
  errorDescription: z.string().optional(),
});

// Refresh tokens schema
export const refreshTokensSchema = z.object({
  platform: PlatformType,
  forceRefresh: z.boolean().default(false),
});

// Test connection schema
export const testConnectionSchema = z.object({
  platform: PlatformType,
  testType: z.enum(['basic', 'permissions', 'api_limits', 'full']).default('basic'),
});

// Update platform settings schema
export const updatePlatformSettingsSchema = z.object({
  platform: PlatformType,
  settings: z.object({
    autoPost: z.boolean().optional(),
    autoReply: z.boolean().optional(),
    notifications: z.object({
      mentions: z.boolean().optional(),
      comments: z.boolean().optional(),
      messages: z.boolean().optional(),
      followers: z.boolean().optional(),
    }).optional(),
    posting: z.object({
      defaultHashtags: z.array(z.string()).max(30).optional(),
      defaultLocation: z.string().optional(),
      autoSchedule: z.boolean().optional(),
      optimalTimes: z.array(
        z.object({
          day: z.number().int().min(0).max(6),
          hour: z.number().int().min(0).max(23),
          minute: z.number().int().min(0).max(59),
        })
      ).optional(),
    }).optional(),
    analytics: z.object({
      trackEngagement: z.boolean().optional(),
      trackReach: z.boolean().optional(),
      trackImpressions: z.boolean().optional(),
      reportFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    }).optional(),
  }),
});

// Sync platform data schema
export const syncPlatformDataSchema = z.object({
  platform: PlatformType,
  dataTypes: z.array(
    z.enum(['profile', 'posts', 'stories', 'followers', 'analytics', 'messages'])
  ).min(1, "At least one data type is required"),
  syncOptions: z.object({
    fullSync: z.boolean().default(false),
    dateRange: z.object({
      from: z.string().datetime(),
      to: z.string().datetime(),
    }).optional(),
    limit: z.number().int().min(1).max(1000).optional(),
  }).optional(),
});

// Platform webhook configuration schema
export const configurePlatformWebhookSchema = z.object({
  platform: PlatformType,
  events: z.array(
    z.enum([
      'posts',
      'comments', 
      'mentions',
      'messages',
      'followers',
      'stories',
      'live_videos'
    ])
  ).min(1, "At least one event type is required"),
  callbackUrl: z.string().url("Invalid callback URL").optional(),
  verifyToken: z.string().min(8, "Verify token must be at least 8 characters").optional(),
});

// Platform insights request schema
export const getPlatformInsightsSchema = z.object({
  platform: PlatformType,
  metrics: z.array(
    z.enum([
      'reach',
      'impressions', 
      'engagement',
      'followers_count',
      'posts_count',
      'stories_count',
      'profile_views',
      'website_clicks'
    ])
  ).optional(),
  period: z.enum(['day', 'week', 'days_28', 'lifetime']).default('week'),
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
});

// Disconnect platform schema
export const disconnectPlatformSchema = z.object({
  platform: PlatformType,
  reason: z.enum([
    'no_longer_needed',
    'switching_accounts',
    'privacy_concerns',
    'technical_issues',
    'other'
  ]).optional(),
  feedback: z.string().max(500, "Feedback cannot exceed 500 characters").optional(),
  deleteData: z.boolean().default(false),
});

// Platform account validation schema
export const validatePlatformAccountSchema = z.object({
  platform: PlatformType,
  accountId: z.string().min(1, "Account ID is required"),
  validationType: z.enum(['business', 'creator', 'personal']).optional(),
});

// Export types
export type ConnectPlatformInput = z.infer<typeof connectPlatformSchema>;
export type HandleCallbackInput = z.infer<typeof handleCallbackSchema>;
export type RefreshTokensInput = z.infer<typeof refreshTokensSchema>;
export type TestConnectionInput = z.infer<typeof testConnectionSchema>;
export type UpdatePlatformSettingsInput = z.infer<typeof updatePlatformSettingsSchema>;
export type SyncPlatformDataInput = z.infer<typeof syncPlatformDataSchema>;
export type ConfigurePlatformWebhookInput = z.infer<typeof configurePlatformWebhookSchema>;
export type GetPlatformInsightsInput = z.infer<typeof getPlatformInsightsSchema>;
export type DisconnectPlatformInput = z.infer<typeof disconnectPlatformSchema>;
export type ValidatePlatformAccountInput = z.infer<typeof validatePlatformAccountSchema>;