import { z } from 'zod';

/**
 * Platform Validation Schemas
 * 
 * Unified validation schemas for all social media platforms
 * ensuring consistent data structure across different platforms.
 */

// Base platform enum
export const platformEnum = z.enum([
  'instagram',
  'facebook', 
  'twitter',
  'linkedin',
  'tiktok',
  'youtube'
]);

// Media type enum
export const mediaTypeEnum = z.enum([
  'image',
  'video',
  'carousel',
  'story',
  'reel',
  'igtv'
]);

// Post status enum
export const postStatusEnum = z.enum([
  'draft',
  'scheduled',
  'published',
  'failed',
  'deleted'
]);

// Base media object schema
export const mediaObjectSchema = z.object({
  url: z.string().url('Invalid media URL'),
  type: mediaTypeEnum,
  alt: z.string().optional(),
  thumbnail: z.string().url().optional(),
  duration: z.number().positive().optional(), // for videos
  size: z.number().positive().optional(),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional(),
});

// Content creation schema - unified for all platforms
export const createPostSchema = z.object({
  body: z.object({
    platform: platformEnum,
    content: z.object({
      text: z.string().max(2200, 'Text content too long').optional(),
      media: z.array(mediaObjectSchema).max(10, 'Too many media files').optional(),
      hashtags: z.array(z.string().regex(/^#\w+/, 'Invalid hashtag format')).max(30).optional(),
      mentions: z.array(z.string().regex(/^@\w+/, 'Invalid mention format')).max(20).optional(),
      location: z.object({
        name: z.string(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        placeId: z.string().optional(),
      }).optional(),
    }),
    scheduling: z.object({
      publishAt: z.string().datetime().optional(),
      timezone: z.string().optional(),
    }).optional(),
    options: z.object({
      disableComments: z.boolean().default(false),
      disableLikes: z.boolean().default(false),
      allowSharing: z.boolean().default(true),
      audienceRestriction: z.enum(['public', 'followers', 'private']).default('public'),
    }).optional(),
  }),
});

// Platform account connection schema
export const connectAccountSchema = z.object({
  body: z.object({
    platform: platformEnum,
    credentials: z.object({
      accessToken: z.string().min(1, 'Access token is required'),
      refreshToken: z.string().optional(),
      expiresIn: z.number().positive().optional(),
      scope: z.array(z.string()).optional(),
      userId: z.string().optional(),
      username: z.string().optional(),
    }),
    accountInfo: z.object({
      accountId: z.string().min(1, 'Account ID is required'),
      username: z.string().min(1, 'Username is required'),
      displayName: z.string().optional(),
      profilePicture: z.string().url().optional(),
      followerCount: z.number().nonnegative().optional(),
      followingCount: z.number().nonnegative().optional(),
      isVerified: z.boolean().default(false),
      accountType: z.enum(['personal', 'business', 'creator']).optional(),
    }),
  }),
});

// Get media schema
export const getMediaSchema = z.object({
  query: z.object({
    platform: platformEnum,
    limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, { message: 'Limit must be between 1 and 100' }).optional(),
    offset: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 0, { message: 'Offset must be non-negative' }).optional(),
    type: mediaTypeEnum.optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

// Analytics request schema
export const analyticsSchema = z.object({
  query: z.object({
    platform: platformEnum,
    metrics: z.array(z.enum([
      'impressions',
      'reach',
      'engagement',
      'likes',
      'comments',
      'shares',
      'saves',
      'clicks',
      'views',
      'followers_gained',
      'followers_lost'
    ])).min(1, 'At least one metric is required'),
    period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('week'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    breakdown: z.enum(['age', 'gender', 'location', 'device']).optional(),
  }),
});

// Webhook subscription schema
export const webhookSubscriptionSchema = z.object({
  body: z.object({
    platform: platformEnum,
    events: z.array(z.enum([
      'post_published',
      'post_deleted',
      'comment_added',
      'comment_deleted',
      'like_added',
      'like_removed',
      'follower_added',
      'follower_removed',
      'mention_received',
      'direct_message'
    ])).min(1, 'At least one event type is required'),
    callbackUrl: z.string().url('Invalid callback URL'),
    secret: z.string().min(8, 'Webhook secret must be at least 8 characters'),
  }),
});

// Platform-specific parameter validation
export const platformParamsSchema = z.object({
  params: z.object({
    platform: platformEnum,
    id: z.string().min(1, 'ID is required').optional(),
  }),
});

// Batch operation schema
export const batchOperationSchema = z.object({
  body: z.object({
    platform: platformEnum,
    operations: z.array(z.object({
      type: z.enum(['create', 'update', 'delete']),
      id: z.string().optional(),
      data: z.record(z.string(), z.any()).optional(),
    })).min(1, 'At least one operation is required').max(50, 'Too many operations'),
  }),
});

// Export types for TypeScript inference
export type Platform = z.infer<typeof platformEnum>;
export type MediaType = z.infer<typeof mediaTypeEnum>;
export type PostStatus = z.infer<typeof postStatusEnum>;
export type MediaObject = z.infer<typeof mediaObjectSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type ConnectAccountInput = z.infer<typeof connectAccountSchema>;
export type GetMediaInput = z.infer<typeof getMediaSchema>;
export type AnalyticsInput = z.infer<typeof analyticsSchema>;
export type WebhookSubscriptionInput = z.infer<typeof webhookSubscriptionSchema>;
export type PlatformParamsInput = z.infer<typeof platformParamsSchema>;
export type BatchOperationInput = z.infer<typeof batchOperationSchema>;