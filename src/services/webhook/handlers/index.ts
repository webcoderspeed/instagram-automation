/**
 * Webhook Event Handlers Index
 * Exports all webhook event handlers for easy importing
 */

// Message-related handlers
export { handleMessages } from './messages';
export { handleMessageDeliveries } from './message-deliveries';
export { handleMessageReactions } from './message-reactions';
export { handleMessagingSeen } from './messaging-seen';

// Interaction handlers
export { handleMessagingPostbacks } from './messaging-postbacks';
export { handleMessagingReferrals } from './messaging-referrals';

// Re-export types for convenience
export type {
  WebhookEventHandler,
  MessageHandler,
  DeliveryHandler,
  ReadHandler,
  PostbackHandler,
  ReferralHandler,
  ReactionHandler,
  WebhookHandlerRegistry,
  HandlerConfig
} from '../types/handlers';

export { WebhookEventType, EventPriority } from '../types/handlers';