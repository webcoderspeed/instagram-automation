/**
 * Instagram Message Reactions Handler
 * Handles Instagram message reactions (likes, hearts, etc.)
 */

import { InstagramMessageWebhook, InstagramHandlerContext } from '../types';
import logger from '../../../utils/logger';

export async function handleMessageReactions(webhook: InstagramMessageWebhook, context: InstagramHandlerContext): Promise<void> {
  try {
    logger.info('Processing Instagram message reaction webhook', { 
      entryCount: webhook.entry.length,
      context 
    });

    for (const entry of webhook.entry) {
      for (const messaging of entry.messaging) {
        // Instagram doesn't have a specific reaction field in the current API
        // This is a placeholder for future reaction support
        // You might need to check for specific message types or custom fields
        
        logger.info('Instagram message reaction event', {
          senderId: messaging.sender.id,
          recipientId: messaging.recipient.id,
          timestamp: messaging.timestamp,
          messageId: messaging.message?.mid
        });

        // Here you could process reactions when Instagram adds support
        // For now, we'll just log the event
      }
    }
  } catch (error) {
    logger.error('Error processing Instagram message reaction webhook', { error, webhook });
    throw error;
  }
}