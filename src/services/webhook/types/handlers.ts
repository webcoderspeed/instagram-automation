/**
 * Type definitions for webhook event handlers
 */

import { WebhookMessaging, WebhookChange } from '../interfaces/base';
import { InstagramMessaging, InstagramChangeValue } from '../interfaces/instagram';

export type WebhookEventHandler<T = unknown> = (entryId: string, data: T) => Promise<void>;

// Messaging event handlers
export type MessageHandler = WebhookEventHandler<WebhookMessaging>;
export type DeliveryHandler = WebhookEventHandler<WebhookMessaging>;
export type ReadHandler = WebhookEventHandler<WebhookMessaging>;
export type PostbackHandler = WebhookEventHandler<WebhookMessaging>;
export type ReferralHandler = WebhookEventHandler<WebhookMessaging>;
export type OptinHandler = WebhookEventHandler<WebhookMessaging>;
export type AccountLinkingHandler = WebhookEventHandler<WebhookMessaging>;
export type ReactionHandler = WebhookEventHandler<WebhookMessaging>;
export type MessageEditHandler = WebhookEventHandler<WebhookMessaging>;
export type GamePlayHandler = WebhookEventHandler<WebhookMessaging>;

// Thread control handlers
export type PassThreadControlHandler = WebhookEventHandler<WebhookMessaging>;
export type TakeThreadControlHandler = WebhookEventHandler<WebhookMessaging>;
export type RequestThreadControlHandler = WebhookEventHandler<WebhookMessaging>;
export type AppRolesHandler = WebhookEventHandler<WebhookMessaging>;

// Instagram-specific handlers
export type InstagramMessageHandler = WebhookEventHandler<InstagramMessaging>;
export type InstagramReadHandler = WebhookEventHandler<InstagramMessaging>;
export type InstagramPostbackHandler = WebhookEventHandler<InstagramMessaging>;
export type InstagramReferralHandler = WebhookEventHandler<InstagramMessaging>;
export type InstagramReactionHandler = WebhookEventHandler<InstagramMessaging>;

// Change event handlers
export type CommentHandler = WebhookEventHandler<InstagramChangeValue>;
export type LiveCommentHandler = WebhookEventHandler<InstagramChangeValue>;
export type MentionHandler = WebhookEventHandler<InstagramChangeValue>;
export type StoryInsightHandler = WebhookEventHandler<InstagramChangeValue>;

// Standby handler
export type StandbyHandler = WebhookEventHandler<WebhookMessaging>;

// Handler registry interface
export interface WebhookHandlerRegistry {
  // Messaging events
  messages: MessageHandler;
  message_deliveries: DeliveryHandler;
  message_reads: ReadHandler;
  messaging_seen: ReadHandler;
  messaging_postbacks: PostbackHandler;
  messaging_referrals: ReferralHandler;
  messaging_optins: OptinHandler;
  messaging_account_linking: AccountLinkingHandler;
  message_reactions: ReactionHandler;
  message_edits: MessageEditHandler;
  messaging_game_plays: GamePlayHandler;
  
  // Thread control
  messaging_handovers: PassThreadControlHandler;
  
  // Change events
  comments: CommentHandler;
  live_comments: LiveCommentHandler;
  mentions: MentionHandler;
  story_insights: StoryInsightHandler;
  
  // Standby
  standby: StandbyHandler;
}

// Event types enum for better type safety
export enum WebhookEventType {
  // Messaging events
  MESSAGES = 'messages',
  MESSAGE_DELIVERIES = 'message_deliveries',
  MESSAGE_READS = 'message_reads',
  MESSAGING_SEEN = 'messaging_seen',
  MESSAGING_POSTBACKS = 'messaging_postbacks',
  MESSAGING_REFERRALS = 'messaging_referrals',
  MESSAGING_OPTINS = 'messaging_optins',
  MESSAGING_ACCOUNT_LINKING = 'messaging_account_linking',
  MESSAGE_REACTIONS = 'message_reactions',
  MESSAGE_EDITS = 'message_edits',
  MESSAGING_GAME_PLAYS = 'messaging_game_plays',
  
  // Thread control
  MESSAGING_HANDOVERS = 'messaging_handovers',
  
  // Change events
  COMMENTS = 'comments',
  LIVE_COMMENTS = 'live_comments',
  MENTIONS = 'mentions',
  STORY_INSIGHTS = 'story_insights',
  
  // Standby
  STANDBY = 'standby'
}

// Event priority levels
export enum EventPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

// Handler configuration
export interface HandlerConfig {
  enabled: boolean;
  priority: EventPriority;
  retryAttempts: number;
  timeout: number;
}