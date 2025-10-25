/**
 * Instagram Webhook Handlers
 * Exports all Instagram webhook event handlers
 */

import { handleMessages } from './messages';
import { handleComments, handleCommentMentions, handleMentions } from './comments';
import { handleMessageDeliveries } from './message-deliveries';
import { handleMessageReactions } from './message-reactions';
import { handleMessagingSeen } from './messaging-seen';
import { handleMessagingPostbacks } from './messaging-postbacks';
import { handleMessagingReferrals } from './messaging-referrals';

// Re-export all handlers
export { handleMessages } from './messages';
export { handleComments, handleCommentMentions, handleMentions } from './comments';
export { handleMessageDeliveries } from './message-deliveries';
export { handleMessageReactions } from './message-reactions';
export { handleMessagingSeen } from './messaging-seen';
export { handleMessagingPostbacks } from './messaging-postbacks';
export { handleMessagingReferrals } from './messaging-referrals';

// Handler registry for easy access
export const instagramHandlers = {
  messages: handleMessages,
  comments: handleComments,
  commentMentions: handleCommentMentions,
  mentions: handleMentions,
  messageDeliveries: handleMessageDeliveries,
  messageReactions: handleMessageReactions,
  messagingSeen: handleMessagingSeen,
  messagingPostbacks: handleMessagingPostbacks,
  messagingReferrals: handleMessagingReferrals,
} as const;