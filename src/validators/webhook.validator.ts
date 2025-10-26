import { z } from 'zod';

// Webhook event type enum
const WebhookEventType = z.enum([
  'messages',
  'messaging_postbacks',
  'messaging_optins',
  'messaging_referrals',
  'messaging_handovers',
  'messaging_policy_enforcement',
  'message_deliveries',
  'message_reads',
  'messaging_account_linking',
  'messaging_checkout_updates',
  'messaging_pre_checkouts',
  'feed',
  'comments',
  'mentions',
  'story_insights',
  'live_comments'
]);

// Platform enum
const Platform = z.enum(['instagram', 'facebook', 'whatsapp']);

// Webhook verification schema
export const verifyWebhookSchema = z.object({
  'hub.mode': z.literal('subscribe'),
  'hub.challenge': z.string().min(1, "Challenge is required"),
  'hub.verify_token': z.string().min(1, "Verify token is required"),
});

// Instagram webhook payload schema
export const instagramWebhookSchema = z.object({
  object: z.literal('instagram'),
  entry: z.array(
    z.object({
      id: z.string(),
      time: z.number(),
      messaging: z.array(
        z.object({
          sender: z.object({
            id: z.string(),
          }),
          recipient: z.object({
            id: z.string(),
          }),
          timestamp: z.number(),
          message: z.object({
            mid: z.string(),
            text: z.string().optional(),
            attachments: z.array(
              z.object({
                type: z.enum(['image', 'video', 'audio', 'file']),
                payload: z.object({
                  url: z.string().url(),
                }),
              })
            ).optional(),
            quick_reply: z.object({
              payload: z.string(),
            }).optional(),
            reply_to: z.object({
              mid: z.string(),
            }).optional(),
          }).optional(),
          postback: z.object({
            title: z.string(),
            payload: z.string(),
            referral: z.object({
              ref: z.string(),
              source: z.string(),
              type: z.string(),
            }).optional(),
          }).optional(),
          referral: z.object({
            ref: z.string(),
            source: z.string(),
            type: z.string(),
            referer_uri: z.string().optional(),
          }).optional(),
          delivery: z.object({
            mids: z.array(z.string()),
            watermark: z.number(),
          }).optional(),
          read: z.object({
            watermark: z.number(),
          }).optional(),
        })
      ).optional(),
      changes: z.array(
        z.object({
          field: z.string(),
          value: z.object({
            id: z.string(),
            media_id: z.string().optional(),
            comment_id: z.string().optional(),
            parent_id: z.string().optional(),
            created_time: z.number().optional(),
            text: z.string().optional(),
            from: z.object({
              id: z.string(),
              username: z.string().optional(),
            }).optional(),
            media: z.object({
              id: z.string(),
              media_product_type: z.string().optional(),
            }).optional(),
          }),
        })
      ).optional(),
    })
  ),
});

// Subscribe webhook schema
export const subscribeWebhookSchema = z.object({
  platform: Platform,
  callbackUrl: z.string().url("Invalid callback URL"),
  verifyToken: z.string().min(8, "Verify token must be at least 8 characters"),
  events: z.array(WebhookEventType).min(1, "At least one event type is required"),
  fields: z.array(z.string()).optional(),
});

// Unsubscribe webhook schema
export const unsubscribeWebhookSchema = z.object({
  platform: Platform,
  subscriptionId: z.string().min(1, "Subscription ID is required"),
});

// Update webhook subscription schema
export const updateWebhookSubscriptionSchema = z.object({
  platform: Platform,
  subscriptionId: z.string().min(1, "Subscription ID is required"),
  callbackUrl: z.string().url("Invalid callback URL").optional(),
  verifyToken: z.string().min(8, "Verify token must be at least 8 characters").optional(),
  events: z.array(WebhookEventType).min(1, "At least one event type is required").optional(),
  fields: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// Webhook delivery attempt schema
export const webhookDeliverySchema = z.object({
  webhookId: z.string().min(1, "Webhook ID is required"),
  eventType: WebhookEventType,
  payload: z.record(z.string(), z.unknown()),
  signature: z.string().min(1, "Signature is required"),
  timestamp: z.number(),
  retryCount: z.number().int().min(0).default(0),
});

// Test webhook schema
export const testWebhookSchema = z.object({
  platform: Platform,
  subscriptionId: z.string().min(1, "Subscription ID is required"),
  eventType: WebhookEventType,
  testPayload: z.record(z.string(), z.unknown()).optional(),
});

// Webhook analytics schema
export const getWebhookAnalyticsSchema = z.object({
  platform: Platform.optional(),
  subscriptionId: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  eventTypes: z.array(WebhookEventType).optional(),
  status: z.enum(['success', 'failed', 'pending', 'retrying']).optional(),
  groupBy: z.enum(['day', 'hour', 'event_type', 'status']).default('day'),
});

// Webhook retry schema
export const retryWebhookSchema = z.object({
  deliveryId: z.string().min(1, "Delivery ID is required"),
  maxRetries: z.number().int().min(1).max(5).default(3),
  retryDelay: z.number().int().min(1).max(3600).default(60), // seconds
});

// Webhook security settings schema
export const updateWebhookSecuritySchema = z.object({
  platform: Platform,
  subscriptionId: z.string().min(1, "Subscription ID is required"),
  enableSignatureVerification: z.boolean().default(true),
  allowedIpAddresses: z.array(
    z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?:\/[0-9]{1,2})?$/, "Invalid IP address format")
  ).optional(),
  rateLimiting: z.object({
    enabled: z.boolean().default(true),
    requestsPerMinute: z.number().int().min(1).max(1000).default(100),
    burstLimit: z.number().int().min(1).max(500).default(50),
  }).optional(),
});

// Export types
export type VerifyWebhookInput = z.infer<typeof verifyWebhookSchema>;
export type InstagramWebhookPayload = z.infer<typeof instagramWebhookSchema>;
export type SubscribeWebhookInput = z.infer<typeof subscribeWebhookSchema>;
export type UnsubscribeWebhookInput = z.infer<typeof unsubscribeWebhookSchema>;
export type UpdateWebhookSubscriptionInput = z.infer<typeof updateWebhookSubscriptionSchema>;
export type WebhookDeliveryInput = z.infer<typeof webhookDeliverySchema>;
export type TestWebhookInput = z.infer<typeof testWebhookSchema>;
export type GetWebhookAnalyticsInput = z.infer<typeof getWebhookAnalyticsSchema>;
export type RetryWebhookInput = z.infer<typeof retryWebhookSchema>;
export type UpdateWebhookSecurityInput = z.infer<typeof updateWebhookSecuritySchema>;