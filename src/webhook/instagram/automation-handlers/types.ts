/**
 * Automation Handler Types
 * Strict type definitions for Instagram automation handlers
 */

import { Types } from 'mongoose';
import { AutomationDocument } from '../../../models/automation.model';

// Strict automation trigger types - only these are allowed
export const AUTOMATION_TRIGGER_TYPES = {
  INSTAGRAM_COMMENT_RECEIVED: 'instagram.comment_received',
  INSTAGRAM_MESSAGE_RECEIVED: 'instagram.message_received',
  INSTAGRAM_MENTION_RECEIVED: 'instagram.mention_received',
  INSTAGRAM_STORY_MENTION: 'instagram.story_mention'
} as const;

export type AutomationTriggerType = typeof AUTOMATION_TRIGGER_TYPES[keyof typeof AUTOMATION_TRIGGER_TYPES];

// Strict automation action types - only these are allowed
export const AUTOMATION_ACTION_TYPES = {
  INSTAGRAM_SEND_MESSAGE: 'instagram.send_message',
  INSTAGRAM_REPLY_TO_COMMENT: 'instagram.reply_to_comment',
  INSTAGRAM_LIKE_COMMENT: 'instagram.like_comment',
  INSTAGRAM_HIDE_COMMENT: 'instagram.hide_comment',
  SAVE_TO_CRM: 'internal.save_to_crm',
  SEND_NOTIFICATION: 'internal.send_notification',
  TRACK_ENGAGEMENT: 'analytics.track_engagement'
} as const;

export type AutomationActionType = typeof AUTOMATION_ACTION_TYPES[keyof typeof AUTOMATION_ACTION_TYPES];

// Incoming webhook message interface
export interface IncomingWebhookMessage {
  senderId: string;
  recipientId: string;
  text: string;
  messageId: string;
  platform: 'instagram';
  timestamp: Date;
  entryId: string;
  metadata: WebhookMessageMetadata;
}

// Strict metadata types for different webhook events
export interface WebhookMessageMetadata {
  type: 'comment' | 'message' | 'mention' | 'story_mention';
  mediaId?: string;
  mediaType?: string;
  parentCommentId?: string;
  username?: string;
  hasAttachments?: boolean;
  storyId?: string;
}

// Strict trigger configuration schemas
export interface CommentTriggerConfig {
  keywords?: string[];
  excludeKeywords?: string[];
  mediaIds?: string[];
  mediaTypes?: ('FEED' | 'STORY' | 'REELS')[];
  authorFilters?: {
    includeVerified?: boolean;
    excludeVerified?: boolean;
    minFollowers?: number;
    maxFollowers?: number;
  };
  parentCommentOnly?: boolean;
  exactMatch?: boolean;
  caseSensitive?: boolean;
}

export interface MessageTriggerConfig {
  keywords?: string[];
  excludeKeywords?: string[];
  exactMatch?: boolean;
  caseSensitive?: boolean;
  requireAttachment?: boolean;
}

export interface MentionTriggerConfig {
  keywords?: string[];
  excludeKeywords?: string[];
  mediaTypes?: ('FEED' | 'STORY' | 'REELS')[];
  exactMatch?: boolean;
  caseSensitive?: boolean;
}

// Strict action configuration schemas
export interface SendMessageActionConfig {
  message: string;
  delay?: number; // seconds
  variables?: Record<string, string>;
}

export interface ReplyToCommentActionConfig {
  replyText: string;
  delay?: number; // seconds
  variables?: Record<string, string>;
}

export interface LikeCommentActionConfig {
  delay?: number; // seconds
}

export interface HideCommentActionConfig {
  delay?: number; // seconds
}

export interface SaveToCRMActionConfig {
  fields: {
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
    tags?: string[];
  };
}

export interface SendNotificationActionConfig {
  channels: ('email' | 'sms' | 'push')[];
  message: string;
  recipients?: string[];
}

export interface TrackEngagementActionConfig {
  eventType: string;
  properties?: Record<string, any>;
}

// Union type for all action configs
export type AutomationActionConfig = 
  | SendMessageActionConfig
  | ReplyToCommentActionConfig
  | LikeCommentActionConfig
  | HideCommentActionConfig
  | SaveToCRMActionConfig
  | SendNotificationActionConfig
  | TrackEngagementActionConfig;

// Automation match result
export interface AutomationMatch {
  automation: AutomationDocument;
  confidence: number;
  matchedKeywords: string[];
  triggerType: 'keyword' | 'condition' | 'media' | 'default';
  matchedConditions?: string[];
}

// Automation execution result
export interface AutomationExecutionResult {
  success: boolean;
  automationId: string;
  executedActions: {
    type: AutomationActionType;
    success: boolean;
    error?: string;
    executionTime: number;
  }[];
  totalExecutionTime: number;
  error?: string;
}

// Handler context for automation processing
export interface AutomationHandlerContext {
  userId: Types.ObjectId;
  platformAccountId: Types.ObjectId;
  webhookSource: string;
  requestId: string;
}

// Base automation handler interface
export interface AutomationHandler {
  triggerType: AutomationTriggerType;
  canHandle(message: IncomingWebhookMessage): boolean;
  findMatchingAutomations(
    message: IncomingWebhookMessage, 
    context: AutomationHandlerContext
  ): Promise<AutomationMatch[]>;
  executeAutomation(
    message: IncomingWebhookMessage,
    match: AutomationMatch,
    context: AutomationHandlerContext
  ): Promise<AutomationExecutionResult>;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}