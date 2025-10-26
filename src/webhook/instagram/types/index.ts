/**
 * Webhook Types
 * Types and interfaces for webhook handling and events
 */

import { BaseEntity, SocialPlatform } from "../../../types";

// Union type for all possible webhook payloads
export type WebhookPayload = 
  | InstagramMessageWebhook
  | InstagramCommentWebhook
  | InstagramMentionWebhook
  | Record<string, unknown>; 

export interface WebhookEvent extends BaseEntity {
  platform: SocialPlatform;
  eventType: WebhookEventType;
  eventId: string;
  accountId?: string;
  payload: WebhookPayload;
  signature?: string;
  headers: Record<string, string>;
  processed: boolean;
  processedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
}

export type WebhookEventType =
  // Instagram Events
  | "instagram.message"
  | "instagram.comment"
  | "instagram.mention"
  | "instagram.story_mention"
  | "instagram.live_comment"
  | "instagram.account_update"
  | "instagram.media_published"

  // Generic Events
  | "account.connected"
  | "account.disconnected"
  | "account.expired"
  | "rate_limit.exceeded"
  | "error.occurred";

export interface WebhookSubscription extends BaseEntity {
  platform: SocialPlatform;
  accountId: string;
  eventTypes: WebhookEventType[];
  callbackUrl: string;
  secret?: string;
  isActive: boolean;
  lastEventAt?: Date;
  eventCount: number;
  errorCount: number;
  lastErrorAt?: Date;
  lastError?: string;
}

export interface WebhookDelivery extends BaseEntity {
  webhookEventId: string;
  subscriptionId: string;
  url: string;
  httpMethod: string;
  headers: Record<string, string>;
  payload: string;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  deliveredAt?: Date;
  error?: string;
  retryCount: number;
  nextRetryAt?: Date;
}

// Instagram Webhook Payloads
export interface InstagramMessageWebhook {
  object: "instagram";
  entry: Array<{
    id: string;
    time: number;
    messaging: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text?: string;
        attachments?: Array<{
          type: string;
          payload: {
            url: string;
          };
        }>;
      };
      postback?: {
        payload: string;
        title: string;
      };
      read?: {
        watermark: number;
      };
      delivery?: {
        mids: string[];
        watermark: number;
      };
    }>;
  }>;
}

export interface InstagramCommentWebhook {
  object: "instagram";
  entry: Array<{
    id: string;
    time: number;
    changes: Array<{
      field: "comments";
      value: {
        id: string;
        text: string;
        created_time: string;
        from: {
          id: string;
          username: string;
        };
        media: {
          id: string;
          media_product_type: string;
        };
        parent_id?: string;
      };
    }>;
  }>;
}

export interface InstagramMentionWebhook {
  object: "instagram";
  entry: Array<{
    id: string;
    time: number;
    changes: Array<{
      field: "mentions";
      value: {
        comment_id?: string;
        media_id: string;
        text: string;
        created_time: string;
        from: {
          id: string;
          username: string;
        };
      };
    }>;
  }>;
}



// Union type specifically for Instagram webhook payloads
export type InstagramWebhookPayload = 
  | InstagramMessageWebhook
  | InstagramCommentWebhook
  | InstagramMentionWebhook;

export interface WebhookProcessor {
  platform: SocialPlatform;
  eventType: WebhookEventType;
  process(event: WebhookEvent): Promise<void>;
  validate(payload: WebhookPayload, signature?: string): boolean;
  retry(event: WebhookEvent): Promise<void>;
}

export interface WebhookConfig {
  platform: SocialPlatform;
  endpoint: string;
  verifyToken?: string;
  secret?: string;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

export interface WebhookVerificationRequest {
  "hub.mode": string;
  "hub.challenge": string;
  "hub.verify_token": string;
}

export interface WebhookStats {
  platform: SocialPlatform;
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  averageProcessingTime: number;
  lastEventAt?: Date;
  errorRate: number;
}

// Instagram-specific handler types
export interface InstagramWebhookHandler {
  handleMessages(webhook: InstagramMessageWebhook): Promise<void>;
  handleComments(webhook: InstagramCommentWebhook): Promise<void>;
  handleMentions(webhook: InstagramMentionWebhook): Promise<void>;
}

export interface InstagramHandlerContext {
  userId: string;
  platformAccountId: string;
  entryId: string;
  timestamp: number;
}
