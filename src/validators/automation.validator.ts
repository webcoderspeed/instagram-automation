/**
 * Structured Automation Validator
 * Type-safe Zod schemas for validating automation based on actual webhook events and platform capabilities
 */

import { z } from 'zod';

// ============================================================================
// CORE ENUMS AND CONSTANTS
// ============================================================================

export const AutomationStatus = z.enum([
  'draft',
  'active', 
  'paused',
  'stopped',
  'completed',
  'failed'
]);

export const SocialPlatform = z.enum(['instagram', 'facebook', 'twitter', 'linkedin']);

export const TriggerType = z.enum([
  // Instagram Triggers
  'instagram.message_received',
  'instagram.comment_received', 
  'instagram.mention_received',
  'instagram.story_mention',
  'instagram.media_published',
  
  // Schedule Triggers
  'schedule.time_based',
  'schedule.recurring',
  
  // Manual Triggers
  'manual.trigger'
]);

export const ActionType = z.enum([
  // Instagram Actions
  'instagram.send_message',
  'instagram.reply_to_comment',
  'instagram.like_comment',
  'instagram.hide_comment',
  'instagram.publish_post',
  'instagram.publish_story',
  
  // Internal Actions
  'internal.save_to_crm',
  'internal.send_notification',
  'internal.webhook_call',
  
  // Analytics Actions
  'analytics.track_engagement',
  'analytics.generate_report'
]);

export const ConditionOperator = z.enum([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'greater_than',
  'less_than',
  'greater_than_or_equal',
  'less_than_or_equal',
  'in',
  'not_in',
  'is_empty',
  'is_not_empty',
  'regex_match'
]);

// ============================================================================
// TRIGGER SCHEMAS
// ============================================================================

const SenderFiltersSchema = z.object({
  includeVerified: z.boolean().optional(),
  excludeBusinessAccounts: z.boolean().optional(),
  minFollowers: z.number().min(0).optional(),
  maxFollowers: z.number().min(0).optional()
});

const InstagramMessageTriggerSchema = z.object({
  type: z.literal('instagram.message_received'),
  config: z.object({
    keywords: z.array(z.string().trim().min(1)).optional(),
     exactMatch: z.boolean().default(false),
     caseSensitive: z.boolean().default(false),
     excludeKeywords: z.array(z.string().trim().min(1)).optional(),
    senderFilters: SenderFiltersSchema.optional()
  })
});

const InstagramCommentTriggerSchema = z.object({
  type: z.literal('instagram.comment_received'),
  config: z.object({
    keywords: z.array(z.string().trim().min(1)).optional(),
    exactMatch: z.boolean().default(false),
    caseSensitive: z.boolean().default(false),
    excludeKeywords: z.array(z.string().trim().min(1)).optional(),
    mediaIds: z.array(z.string().trim().min(1)).optional(),
    mediaTypes: z.array(z.enum(['photo', 'video', 'carousel'])).optional(),
    authorFilters: SenderFiltersSchema.optional(),
    parentCommentOnly: z.boolean().default(false)
  })
});

const InstagramMentionTriggerSchema = z.object({
  type: z.literal('instagram.mention_received'),
  config: z.object({
    keywords: z.array(z.string().trim().min(1)).optional(),
    exactMatch: z.boolean().default(false),
    caseSensitive: z.boolean().default(false),
    excludeKeywords: z.array(z.string().trim().min(1)).optional(),
    mentionTypes: z.array(z.enum(['comment', 'story'])).optional(),
    authorFilters: SenderFiltersSchema.optional()
  })
});

const ScheduleTimeTriggerSchema = z.object({
  type: z.literal('schedule.time_based'),
  config: z.object({
    executeAt: z.string().datetime(),
    timezone: z.string().default('UTC')
  })
});

const ScheduleRecurringTriggerSchema = z.object({
  type: z.literal('schedule.recurring'),
  config: z.object({
    cron: z.string().min(1),
    timezone: z.string().default('UTC'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    maxExecutions: z.number().positive().optional()
  })
});

const ManualTriggerSchema = z.object({
  type: z.literal('manual.trigger'),
  config: z.object({})
});

export const AutomationTriggerSchema = z.discriminatedUnion('type', [
  InstagramMessageTriggerSchema,
  InstagramCommentTriggerSchema,
  InstagramMentionTriggerSchema,
  ScheduleTimeTriggerSchema,
  ScheduleRecurringTriggerSchema,
  ManualTriggerSchema
]);

// ============================================================================
// ACTION SCHEMAS
// ============================================================================

const QuickReplySchema = z.object({
  title: z.string().min(1).max(20),
  payload: z.string().min(1).max(1000)
});

const ButtonSchema = z.object({
  type: z.enum(['web_url', 'postback']),
  title: z.string().min(1).max(20),
  url: z.string().url().optional(),
  payload: z.string().max(1000).optional()
});

const InstagramSendMessageActionSchema = z.object({
  type: z.literal('instagram.send_message'),
  config: z.object({
    messageType: z.enum(['text', 'quick_reply', 'button_template', 'generic_template']),
    content: z.object({
      text: z.string().max(1000).optional(),
      quickReplies: z.array(QuickReplySchema).max(13).optional(),
      buttons: z.array(ButtonSchema).max(3).optional(),
      template: z.object({
        elements: z.array(z.object({
          title: z.string().min(1).max(80),
          subtitle: z.string().max(80).optional(),
          imageUrl: z.string().url().optional(),
          buttons: z.array(ButtonSchema).max(3).optional()
        })).max(10)
      }).optional()
    }),
    delay: z.number().min(0).max(3600).default(0)
  })
});

const InstagramReplyToCommentActionSchema = z.object({
  type: z.literal('instagram.reply_to_comment'),
  config: z.object({
    replyText: z.string().min(1).max(8000),
    useVariables: z.boolean().default(false),
    delay: z.number().min(0).max(3600).default(0)
  })
});

const InstagramLikeCommentActionSchema = z.object({
  type: z.literal('instagram.like_comment'),
  config: z.object({
    delay: z.number().min(0).max(3600).default(0)
  })
});

const InstagramHideCommentActionSchema = z.object({
  type: z.literal('instagram.hide_comment'),
  config: z.object({
    reason: z.string().max(500).optional(),
    delay: z.number().min(0).max(3600).default(0)
  })
});

const InstagramPublishPostActionSchema = z.object({
  type: z.literal('instagram.publish_post'),
  config: z.object({
    mediaType: z.enum(['photo', 'video', 'carousel']),
    mediaUrls: z.array(z.string().url()).min(1).max(10),
    caption: z.string().max(2200),
    hashtags: z.array(z.string().regex(/^[a-zA-Z0-9_]+$/)).max(30).optional(),
    mentions: z.array(z.string().regex(/^[a-zA-Z0-9_.]+$/)).max(20).optional(),
    location: z.object({
      name: z.string().min(1).max(100),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional()
    }).optional(),
    useVariables: z.boolean().default(false)
  })
});

const SaveToCrmActionSchema = z.object({
  type: z.literal('internal.save_to_crm'),
  config: z.object({
    fields: z.object({
      name: z.string().max(100).optional(),
      email: z.string().email().optional(),
      phone: z.string().max(20).optional(),
      source: z.string().min(1).max(50),
      notes: z.string().max(1000).optional(),
      tags: z.array(z.string().trim().min(1)).max(10).optional()
    }),
    useVariables: z.boolean().default(false)
  })
});

const SendNotificationActionSchema = z.object({
  type: z.literal('internal.send_notification'),
  config: z.object({
    notificationType: z.enum(['email', 'sms', 'push', 'slack', 'discord']),
    recipients: z.array(z.string().min(1)).min(1).max(10),
    subject: z.string().max(200).optional(),
    message: z.string().min(1).max(4000),
    useVariables: z.boolean().default(false)
  })
});

const WebhookCallActionSchema = z.object({
  type: z.literal('internal.webhook_call'),
  config: z.object({
    url: z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH']),
    headers: z.record(z.string(), z.string()).optional(),
    body: z.record(z.string(), z.unknown()).optional(),
    timeout: z.number().min(1).max(300).default(30),
    retries: z.number().min(0).max(5).default(3),
    useVariables: z.boolean().default(false)
  })
});

const TrackEngagementActionSchema = z.object({
  type: z.literal('analytics.track_engagement'),
  config: z.object({
    eventName: z.string().min(1).max(100),
    properties: z.record(z.string(), z.unknown()).optional(),
    useVariables: z.boolean().default(false)
  })
});

export const AutomationActionSchema = z.discriminatedUnion('type', [
  InstagramSendMessageActionSchema,
  InstagramReplyToCommentActionSchema,
  InstagramLikeCommentActionSchema,
  InstagramHideCommentActionSchema,
  InstagramPublishPostActionSchema,
  SaveToCrmActionSchema,
  SendNotificationActionSchema,
  WebhookCallActionSchema,
  TrackEngagementActionSchema
]);

// ============================================================================
// CONDITION SCHEMA
// ============================================================================

export const AutomationConditionSchema = z.object({
  field: z.string().min(1),
  operator: ConditionOperator,
  value: z.unknown(),
  logicalOperator: z.enum(['AND', 'OR']).optional()
});

// ============================================================================
// SETTINGS SCHEMA
// ============================================================================

export const AutomationSettingsSchema = z.object({
  // Execution Limits
  maxExecutionsPerDay: z.number().positive().optional(),
  maxExecutionsPerMonth: z.number().positive().optional(),
  maxTotalExecutions: z.number().positive().optional(),
  
  // Rate Limiting
  rateLimitPerMinute: z.number().positive().max(60).optional(),
  rateLimitPerHour: z.number().positive().max(3600).optional(),
  
  // Timing
  activeHours: z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    timezone: z.string(),
    daysOfWeek: z.array(z.number().min(0).max(6)).min(1).max(7)
  }).optional(),
  
  // Error Handling
  stopOnError: z.boolean().default(false),
  maxRetries: z.number().min(0).max(10).default(3),
  retryDelay: z.number().min(1).max(3600).default(60),
  
  // Notifications
  notifyOnSuccess: z.boolean().default(false),
  notifyOnError: z.boolean().default(true),
  notificationChannels: z.array(z.string()).optional(),
  
  // Advanced
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  timeout: z.number().min(1).max(300).default(30),
  variables: z.record(z.string(), z.string()).optional()
});

// ============================================================================
// MAIN AUTOMATION SCHEMAS
// ============================================================================

export const createAutomationSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).trim(),
    description: z.string().max(500).trim().optional(),
    platform: SocialPlatform,
    platformAccountIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1).max(5),
    trigger: AutomationTriggerSchema,
    conditions: z.array(AutomationConditionSchema).max(10).optional(),
    actions: z.array(AutomationActionSchema).min(1).max(5),
    settings: AutomationSettingsSchema.optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(10).optional(),
    category: z.string().max(50).optional()
  })
});

export const updateAutomationSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    description: z.string().max(500).trim().optional(),
    platformAccountIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1).max(5).optional(),
    trigger: AutomationTriggerSchema.optional(),
    conditions: z.array(AutomationConditionSchema).max(10).optional(),
    actions: z.array(AutomationActionSchema).min(1).max(5).optional(),
    settings: AutomationSettingsSchema.optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(10).optional(),
    category: z.string().max(50).optional()
  })
});

export const automationStatusSchema = z.object({
  status: AutomationStatus
});

export const executeAutomationSchema = z.object({
  force: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  testData: z.record(z.string(), z.unknown()).optional()
});

export const automationAnalyticsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  metrics: z.array(z.enum([
    'executions',
    'success_rate', 
    'avg_execution_time',
    'errors',
    'triggers',
    'actions_executed'
  ])).optional()
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateAutomationInput = z.infer<typeof createAutomationSchema>;
export type UpdateAutomationInput = z.infer<typeof updateAutomationSchema>;
export type AutomationStatusInput = z.infer<typeof automationStatusSchema>;
export type ExecuteAutomationInput = z.infer<typeof executeAutomationSchema>;
export type AutomationAnalyticsInput = z.infer<typeof automationAnalyticsSchema>;
export type AutomationTrigger = z.infer<typeof AutomationTriggerSchema>;
export type AutomationAction = z.infer<typeof AutomationActionSchema>;
export type AutomationCondition = z.infer<typeof AutomationConditionSchema>;
export type AutomationSettings = z.infer<typeof AutomationSettingsSchema>;