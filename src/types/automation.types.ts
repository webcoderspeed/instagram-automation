/**
 * Structured Automation Types
 * Type-safe automation system based on actual webhook events and platform capabilities
 */

import { Types } from 'mongoose';
import { SocialPlatform } from './index';

// ============================================================================
// AUTOMATION CORE TYPES
// ============================================================================

export const AutomationStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  STOPPED: 'stopped',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

export type AutomationStatusType = typeof AutomationStatus[keyof typeof AutomationStatus];

// ============================================================================
// TRIGGER TYPES - Based on actual webhook events
// ============================================================================

export const TriggerType = {
  // Instagram Triggers
  INSTAGRAM_MESSAGE_RECEIVED: 'instagram.message_received',
  INSTAGRAM_COMMENT_RECEIVED: 'instagram.comment_received',
  INSTAGRAM_MENTION_RECEIVED: 'instagram.mention_received',
  INSTAGRAM_STORY_MENTION: 'instagram.story_mention',
  INSTAGRAM_MEDIA_PUBLISHED: 'instagram.media_published',
  
  // Schedule Triggers
  SCHEDULE_TIME_BASED: 'schedule.time_based',
  SCHEDULE_RECURRING: 'schedule.recurring',
  
  // Manual Triggers
  MANUAL_TRIGGER: 'manual.trigger'
} as const;

export type TriggerTypeType = typeof TriggerType[keyof typeof TriggerType];

// ============================================================================
// TRIGGER CONFIGURATIONS
// ============================================================================

export interface InstagramMessageTrigger {
  type: typeof TriggerType.INSTAGRAM_MESSAGE_RECEIVED;
  config: {
    keywords?: string[];
    exactMatch?: boolean;
    caseSensitive?: boolean;
    excludeKeywords?: string[];
    senderFilters?: {
      includeVerified?: boolean;
      excludeBusinessAccounts?: boolean;
      minFollowers?: number;
      maxFollowers?: number;
    };
  };
}

export interface InstagramCommentTrigger {
  type: typeof TriggerType.INSTAGRAM_COMMENT_RECEIVED;
  config: {
    keywords?: string[];
    exactMatch?: boolean;
    caseSensitive?: boolean;
    excludeKeywords?: string[];
    mediaIds?: string[]; // Specific posts to monitor
    mediaTypes?: ('photo' | 'video' | 'carousel')[];
    authorFilters?: {
      includeVerified?: boolean;
      excludeBusinessAccounts?: boolean;
      minFollowers?: number;
      maxFollowers?: number;
    };
    parentCommentOnly?: boolean; // Only top-level comments, not replies
  };
}

export interface InstagramMentionTrigger {
  type: typeof TriggerType.INSTAGRAM_MENTION_RECEIVED;
  config: {
    keywords?: string[];
    exactMatch?: boolean;
    caseSensitive?: boolean;
    excludeKeywords?: string[];
    mentionTypes?: ('comment' | 'story')[];
    authorFilters?: {
      includeVerified?: boolean;
      excludeBusinessAccounts?: boolean;
      minFollowers?: number;
      maxFollowers?: number;
    };
  };
}

export interface ScheduleTimeTrigger {
  type: typeof TriggerType.SCHEDULE_TIME_BASED;
  config: {
    executeAt: Date;
    timezone: string;
  };
}

export interface ScheduleRecurringTrigger {
  type: typeof TriggerType.SCHEDULE_RECURRING;
  config: {
    cron: string;
    timezone: string;
    startDate?: Date;
    endDate?: Date;
    maxExecutions?: number;
  };
}

export interface ManualTrigger {
  type: typeof TriggerType.MANUAL_TRIGGER;
  config: Record<string, never>; // Empty config for manual triggers
}

export type AutomationTrigger = 
  | InstagramMessageTrigger
  | InstagramCommentTrigger
  | InstagramMentionTrigger
  | ScheduleTimeTrigger
  | ScheduleRecurringTrigger
  | ManualTrigger;

// ============================================================================
// ACTION TYPES - Based on platform capabilities
// ============================================================================

export const ActionType = {
  // Instagram Actions
  INSTAGRAM_SEND_MESSAGE: 'instagram.send_message',
  INSTAGRAM_REPLY_TO_COMMENT: 'instagram.reply_to_comment',
  INSTAGRAM_LIKE_COMMENT: 'instagram.like_comment',
  INSTAGRAM_HIDE_COMMENT: 'instagram.hide_comment',
  INSTAGRAM_PUBLISH_POST: 'instagram.publish_post',
  INSTAGRAM_PUBLISH_STORY: 'instagram.publish_story',
  
  // Internal Actions
  SAVE_TO_CRM: 'internal.save_to_crm',
  SEND_NOTIFICATION: 'internal.send_notification',
  WEBHOOK_CALL: 'internal.webhook_call',
  
  // Analytics Actions
  TRACK_ENGAGEMENT: 'analytics.track_engagement',
  GENERATE_REPORT: 'analytics.generate_report'
} as const;

export type ActionTypeType = typeof ActionType[keyof typeof ActionType];

// ============================================================================
// ACTION CONFIGURATIONS
// ============================================================================

export interface InstagramSendMessageAction {
  type: typeof ActionType.INSTAGRAM_SEND_MESSAGE;
  config: {
    messageType: 'text' | 'quick_reply' | 'button_template' | 'generic_template';
    content: {
      text?: string;
      quickReplies?: Array<{
        title: string;
        payload: string;
      }>;
      buttons?: Array<{
        type: 'web_url' | 'postback';
        title: string;
        url?: string;
        payload?: string;
      }>;
      template?: {
        elements: Array<{
          title: string;
          subtitle?: string;
          imageUrl?: string;
          buttons?: Array<{
            type: 'web_url' | 'postback';
            title: string;
            url?: string;
            payload?: string;
          }>;
        }>;
      };
    };
    delay?: number; // Delay in seconds before sending
  };
}

export interface InstagramReplyToCommentAction {
  type: typeof ActionType.INSTAGRAM_REPLY_TO_COMMENT;
  config: {
    replyText: string;
    useVariables?: boolean; // Use variables like {{username}}, {{comment_text}}
    delay?: number;
  };
}

export interface InstagramLikeCommentAction {
  type: typeof ActionType.INSTAGRAM_LIKE_COMMENT;
  config: {
    delay?: number;
  };
}

export interface InstagramHideCommentAction {
  type: typeof ActionType.INSTAGRAM_HIDE_COMMENT;
  config: {
    reason?: string;
    delay?: number;
  };
}

export interface InstagramPublishPostAction {
  type: typeof ActionType.INSTAGRAM_PUBLISH_POST;
  config: {
    mediaType: 'photo' | 'video' | 'carousel';
    mediaUrls: string[];
    caption: string;
    hashtags?: string[];
    mentions?: string[];
    location?: {
      name: string;
      latitude?: number;
      longitude?: number;
    };
    useVariables?: boolean;
  };
}

export interface SaveToCrmAction {
  type: typeof ActionType.SAVE_TO_CRM;
  config: {
    fields: {
      name?: string;
      email?: string;
      phone?: string;
      source: string;
      notes?: string;
      tags?: string[];
    };
    useVariables?: boolean;
  };
}

export interface SendNotificationAction {
  type: typeof ActionType.SEND_NOTIFICATION;
  config: {
    notificationType: 'email' | 'sms' | 'push' | 'slack' | 'discord';
    recipients: string[];
    subject?: string;
    message: string;
    useVariables?: boolean;
  };
}

export interface WebhookCallAction {
  type: typeof ActionType.WEBHOOK_CALL;
  config: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH';
    headers?: Record<string, string>;
    body?: Record<string, unknown>;
    timeout?: number;
    retries?: number;
    useVariables?: boolean;
  };
}

export interface TrackEngagementAction {
  type: typeof ActionType.TRACK_ENGAGEMENT;
  config: {
    eventName: string;
    properties?: Record<string, unknown>;
    useVariables?: boolean;
  };
}

export type AutomationAction = 
  | InstagramSendMessageAction
  | InstagramReplyToCommentAction
  | InstagramLikeCommentAction
  | InstagramHideCommentAction
  | InstagramPublishPostAction
  | SaveToCrmAction
  | SendNotificationAction
  | WebhookCallAction
  | TrackEngagementAction;

// ============================================================================
// CONDITION TYPES
// ============================================================================

export const ConditionOperator = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
  STARTS_WITH: 'starts_with',
  ENDS_WITH: 'ends_with',
  GREATER_THAN: 'greater_than',
  LESS_THAN: 'less_than',
  GREATER_THAN_OR_EQUAL: 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL: 'less_than_or_equal',
  IN: 'in',
  NOT_IN: 'not_in',
  IS_EMPTY: 'is_empty',
  IS_NOT_EMPTY: 'is_not_empty',
  REGEX_MATCH: 'regex_match'
} as const;

export type ConditionOperatorType = typeof ConditionOperator[keyof typeof ConditionOperator];

export interface AutomationCondition {
  field: string; // e.g., 'sender.follower_count', 'message.text', 'comment.author.verified'
  operator: ConditionOperatorType;
  value: unknown;
  logicalOperator?: 'AND' | 'OR'; // For chaining conditions
}

// ============================================================================
// AUTOMATION SETTINGS
// ============================================================================

export interface AutomationSettings {
  // Execution Limits
  maxExecutionsPerDay?: number;
  maxExecutionsPerMonth?: number;
  maxTotalExecutions?: number;
  
  // Rate Limiting
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
  
  // Timing
  activeHours?: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
    daysOfWeek: number[]; // 0-6, Sunday = 0
  };
  
  // Error Handling
  stopOnError?: boolean;
  maxRetries?: number;
  retryDelay?: number; // seconds
  
  // Notifications
  notifyOnSuccess?: boolean;
  notifyOnError?: boolean;
  notificationChannels?: string[];
  
  // Advanced
  priority?: 'low' | 'normal' | 'high';
  timeout?: number; // seconds
  variables?: Record<string, string>; // Custom variables for this automation
}

// ============================================================================
// MAIN AUTOMATION INTERFACE
// ============================================================================

export interface StructuredAutomation {
  // Basic Info
  id?: string;
  name: string;
  description?: string;
  status: AutomationStatusType;
  
  // Ownership & Platform
  userId: Types.ObjectId;
  platformAccountIds: Types.ObjectId[];
  platform: SocialPlatform;
  
  // Core Configuration
  trigger: AutomationTrigger;
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
  settings?: AutomationSettings;
  
  // Execution Data
  executionStats: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    lastExecutedAt?: Date;
    nextExecutionAt?: Date;
    averageExecutionTime: number; // milliseconds
  };
  
  // Metadata
  tags?: string[];
  category?: string;
  version: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// ============================================================================
// AUTOMATION EXECUTION CONTEXT
// ============================================================================

export interface AutomationExecutionContext {
  automationId: string;
  executionId: string;
  triggeredAt: Date;
  triggerData: {
    type: TriggerTypeType;
    payload: unknown; // The actual webhook payload or trigger data
    metadata: Record<string, unknown>;
  };
  variables: Record<string, unknown>; // Dynamic variables extracted from trigger
  platformAccount: {
    id: string;
    platform: SocialPlatform;
    accessToken: string;
  };
}

// ============================================================================
// AUTOMATION EXECUTION RESULT
// ============================================================================

export interface AutomationExecutionResult {
  executionId: string;
  automationId: string;
  success: boolean;
  executedAt: Date;
  executionTime: number; // milliseconds
  actionsExecuted: number;
  actionsSuccessful: number;
  actionsFailed: number;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  logs: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error';
    message: string;
    data?: unknown;
  }>;
}