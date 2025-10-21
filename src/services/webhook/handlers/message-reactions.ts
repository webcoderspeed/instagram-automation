/**
 * Message Reactions webhook event handler
 * Handles reaction events when customers add or remove emoji reactions to messages
 * Based on: https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-reactions
 */

import logger from '../../../utils/logger';
import { messagingService } from '../../messaging';
import { WebhookMessaging } from '../interfaces/base';
import { ReactionHandler } from '../types/handlers';

export const handleMessageReactions: ReactionHandler = async (entryId: string, messaging: WebhookMessaging): Promise<void> => {
  try {
    const { sender, recipient, reaction, timestamp } = messaging;

    if (!reaction) {
      logger.warn('Message reaction event received without reaction data', { entryId, sender: sender.id });
      return;
    }

    logger.info('Processing message reaction event', {
      entryId,
      senderId: sender.id,
      recipientId: recipient.id,
      messageId: reaction.mid,
      emoji: reaction.emoji,
      action: reaction.action,
      timestamp,
      eventType: 'message_reactions'
    });

    // Process the reaction based on action type
    if (reaction.action === 'react' && reaction.mid && reaction.emoji) {
      await processReactionAdded(sender.id, recipient.id, reaction.mid, reaction.emoji, timestamp);
    } else if (reaction.action === 'unreact' && reaction.mid && reaction.emoji) {
      await processReactionRemoved(sender.id, recipient.id, reaction.mid, reaction.emoji, timestamp);
    }

    logger.debug('Message reaction event processed successfully', {
      senderId: sender.id,
      messageId: reaction.mid,
      action: reaction.action,
      emoji: reaction.emoji
    });

  } catch (error) {
    logger.error('Error processing message reaction event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      entryId,
      senderId: messaging.sender?.id,
      messageId: messaging.reaction?.mid,
      action: messaging.reaction?.action
    });
  }
};

async function processReactionAdded(
  senderId: string,
  recipientId: string,
  messageId: string,
  emoji: string,
  timestamp: number
): Promise<void> {
  try {
    logger.debug('Processing reaction added', {
      senderId,
      recipientId,
      messageId,
      emoji,
      timestamp
    });

    // Store reaction in database
    await storeReaction(senderId, recipientId, messageId, emoji, 'added', timestamp);

    // Track reaction analytics
    await trackReactionAnalytics(senderId, recipientId, messageId, emoji, 'added', timestamp);

    // Handle specific emoji reactions
    await handleSpecificEmojiReaction(senderId, recipientId, messageId, emoji);

    // Trigger reaction-based automations
    await triggerReactionAutomations(senderId, recipientId, messageId, emoji, 'added');

    logger.debug('Reaction added processed successfully', { messageId, senderId, emoji });

  } catch (error) {
    logger.error('Failed to process reaction added', {
      error: error instanceof Error ? error.message : 'Unknown error',
      messageId,
      senderId,
      emoji
    });
  }
}

async function processReactionRemoved(
  senderId: string,
  recipientId: string,
  messageId: string,
  emoji: string,
  timestamp: number
): Promise<void> {
  try {
    logger.debug('Processing reaction removed', {
      senderId,
      recipientId,
      messageId,
      emoji,
      timestamp
    });

    // Update reaction in database
    await storeReaction(senderId, recipientId, messageId, emoji, 'removed', timestamp);

    // Track reaction analytics
    await trackReactionAnalytics(senderId, recipientId, messageId, emoji, 'removed', timestamp);

    // Trigger reaction removal automations
    await triggerReactionAutomations(senderId, recipientId, messageId, emoji, 'removed');

    logger.debug('Reaction removed processed successfully', { messageId, senderId, emoji });

  } catch (error) {
    logger.error('Failed to process reaction removed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      messageId,
      senderId,
      emoji
    });
  }
}

async function storeReaction(
  senderId: string,
  recipientId: string,
  messageId: string,
  emoji: string,
  action: 'added' | 'removed',
  timestamp: number
): Promise<void> {
  try {
    // TODO: Implement database storage logic
    // Example:
    // if (action === 'added') {
    //   await db.reactions.upsert({
    //     where: {
    //       messageId_senderId: { messageId, senderId }
    //     },
    //     create: {
    //       messageId,
    //       senderId,
    //       recipientId,
    //       emoji,
    //       createdAt: new Date(timestamp),
    //       updatedAt: new Date(timestamp)
    //     },
    //     update: {
    //       emoji,
    //       updatedAt: new Date(timestamp)
    //     }
    //   });
    // } else {
    //   await db.reactions.delete({
    //     where: {
    //       messageId_senderId: { messageId, senderId }
    //     }
    //   });
    // }

    logger.debug('Reaction stored', { messageId, senderId, emoji, action });
  } catch (error) {
    logger.error('Failed to store reaction', {
      error: error instanceof Error ? error.message : 'Unknown error',
      messageId,
      senderId,
      emoji,
      action
    });
  }
}

async function trackReactionAnalytics(
  senderId: string,
  recipientId: string,
  messageId: string,
  emoji: string,
  action: 'added' | 'removed',
  timestamp: number
): Promise<void> {
  try {
    // TODO: Implement analytics tracking
    // Example:
    // await analytics.track('message_reaction', {
    //   senderId,
    //   recipientId,
    //   messageId,
    //   emoji,
    //   action,
    //   timestamp,
    //   platform: 'instagram'
    // });

    logger.debug('Reaction analytics tracked', { messageId, senderId, emoji, action });
  } catch (error) {
    logger.error('Failed to track reaction analytics', {
      error: error instanceof Error ? error.message : 'Unknown error',
      messageId,
      senderId,
      emoji,
      action
    });
  }
}

async function handleSpecificEmojiReaction(
  senderId: string,
  recipientId: string,
  messageId: string,
  emoji: string
): Promise<void> {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken) {
      logger.warn('No access token available for emoji reaction response');
      return;
    }

    let responseMessage = '';

    // Handle specific emoji reactions with appropriate responses
    switch (emoji) {
      case '❤️':
      case '😍':
      case '🥰':
        responseMessage = 'Thank you for the love! ❤️ Is there anything else I can help you with?';
        break;
      
      case '👍':
      case '✅':
        responseMessage = 'Great! I\'m glad that was helpful. Let me know if you need anything else!';
        break;
      
      case '😂':
      case '😄':
        responseMessage = 'Glad I could make you smile! 😊 How else can I assist you?';
        break;
      
      case '😢':
      case '😞':
        responseMessage = 'I\'m sorry to hear that. How can I help make things better?';
        break;
      
      case '😡':
      case '😠':
        responseMessage = 'I understand you\'re frustrated. Let me help resolve this issue for you.';
        break;
      
      case '🤔':
      case '❓':
        responseMessage = 'Do you have any questions? I\'m here to help clarify anything!';
        break;
      
      case '🔥':
        responseMessage = 'That\'s awesome! 🔥 What else would you like to know?';
        break;
      
      default:
        // Don't send automatic responses for other emojis
        logger.debug('No specific response for emoji', { emoji, senderId });
        return;
    }

    // Send response only if we have a specific message for this emoji
    if (responseMessage) {
      await messagingService.sendDirectMessage({
        recipientId: senderId,
        message: responseMessage,
        accessToken,
        instagramUserId: recipientId
      });

      logger.info('Emoji reaction response sent', { senderId, emoji, responseMessage });
    }

  } catch (error) {
    logger.error('Failed to handle specific emoji reaction', {
      error: error instanceof Error ? error.message : 'Unknown error',
      senderId,
      emoji
    });
  }
}

async function triggerReactionAutomations(
  senderId: string,
  recipientId: string,
  messageId: string,
  emoji: string,
  action: 'added' | 'removed'
): Promise<void> {
  try {
    // TODO: Implement reaction-based automations
    // Examples:
    // - Tag customers based on reaction sentiment
    // - Trigger follow-up sequences for positive reactions
    // - Alert support team for negative reactions
    // - Update customer satisfaction scores
    // - Trigger product recommendations for love reactions

    logger.debug('Reaction automations triggered', { messageId, senderId, emoji, action });
  } catch (error) {
    logger.error('Failed to trigger reaction automations', {
      error: error instanceof Error ? error.message : 'Unknown error',
      messageId,
      senderId,
      emoji,
      action
    });
  }
}

// Utility function to categorize emoji sentiment
export function categorizeEmojiSentiment(emoji: string): 'positive' | 'negative' | 'neutral' {
  const positiveEmojis = ['❤️', '😍', '🥰', '👍', '✅', '😂', '😄', '😊', '🔥', '👏', '🎉'];
  const negativeEmojis = ['😢', '😞', '😡', '😠', '👎', '😤', '💔'];

  if (positiveEmojis.includes(emoji)) {
    return 'positive';
  } else if (negativeEmojis.includes(emoji)) {
    return 'negative';
  } else {
    return 'neutral';
  }
}

// Utility function to get reaction statistics for a message
export async function getMessageReactionStats(messageId: string): Promise<{
  totalReactions: number;
  emojiCounts: Record<string, number>;
  sentimentBreakdown: Record<string, number>;
}> {
  try {
    // TODO: Implement database query to get reaction stats
    // Example:
    // const reactions = await db.reactions.findMany({
    //   where: { messageId }
    // });

    // For now, return empty stats
    return {
      totalReactions: 0,
      emojiCounts: {},
      sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 }
    };
  } catch (error) {
    logger.error('Failed to get message reaction stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
      messageId
    });
    return {
      totalReactions: 0,
      emojiCounts: {},
      sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 }
    };
  }
}