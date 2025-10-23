/**
 * Webhook Types
 * Types and interfaces for webhook handling and events
 */

import { BaseEntity, SocialPlatform } from './common.types';

export interface WebhookEvent extends BaseEntity {
  platform: SocialPlatform;
  eventType: WebhookEventType;
  eventId: string;
  accountId?: string;
  payload: Record<string, any>;
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
  | 'instagram.message'
  | 'instagram.comment'
  | 'instagram.mention'
  | 'instagram.story_mention'
  | 'instagram.live_comment'
  | 'instagram.account_update'
  | 'instagram.media_published'
  
  // Facebook Events
  | 'facebook.message'
  | 'facebook.comment'
  | 'facebook.post'
  | 'facebook.page_update'
  | 'facebook.lead'
  
  // Twitter Events
  | 'twitter.tweet'
  | 'twitter.mention'
  | 'twitter.direct_message'
  | 'twitter.follow'
  | 'twitter.like'
  | 'twitter.retweet'
  
  // LinkedIn Events
  | 'linkedin.message'
  | 'linkedin.comment'
  | 'linkedin.share'
  | 'linkedin.connection'
  
  // Generic Events
  | 'account.connected'
  | 'account.disconnected'
  | 'account.expired'
  | 'rate_limit.exceeded'
  | 'error.occurred';

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
  object: 'instagram';
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
  object: 'instagram';
  entry: Array<{
    id: string;
    time: number;
    changes: Array<{
      field: 'comments';
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
  object: 'instagram';
  entry: Array<{
    id: string;
    time: number;
    changes: Array<{
      field: 'mentions';
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

// Facebook Webhook Payloads
export interface FacebookMessageWebhook {
  object: 'page';
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

// Twitter Webhook Payloads
export interface TwitterWebhook {
  for_user_id: string;
  tweet_create_events?: Array<{
    id_str: string;
    text: string;
    user: {
      id_str: string;
      screen_name: string;
      name: string;
    };
    created_at: string;
    in_reply_to_status_id_str?: string;
    entities: {
      hashtags: Array<{ text: string }>;
      user_mentions: Array<{
        id_str: string;
        screen_name: string;
        name: string;
      }>;
    };
  }>;
  direct_message_events?: Array<{
    id: string;
    type: string;
    created_timestamp: string;
    message_create: {
      target: { recipient_id: string };
      sender_id: string;
      message_data: {
        text: string;
        attachment?: {
          type: string;
          media: {
            id_str: string;
            media_url: string;
          };
        };
      };
    };
  }>;
  follow_events?: Array<{
    type: string;
    created_timestamp: string;
    target: { id: string; screen_name: string };
    source: { id: string; screen_name: string };
  }>;
}

export interface WebhookProcessor {
  platform: SocialPlatform;
  eventType: WebhookEventType;
  process(event: WebhookEvent): Promise<void>;
  validate(payload: any, signature?: string): boolean;
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
  'hub.mode': string;
  'hub.challenge': string;
  'hub.verify_token': string;
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