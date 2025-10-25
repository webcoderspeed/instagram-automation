/**
 * Instagram Message Deliveries Handler
 * Handles Instagram message delivery confirmations
 */

import { InstagramMessageWebhook, InstagramHandlerContext } from '../types';
import logger from '../../../utils/logger';

export async function handleMessageDeliveries(webhook: InstagramMessageWebhook, context: InstagramHandlerContext): Promise<void> {
  try {
    logger.info('Processing Instagram message delivery webhook', { 
      entryCount: webhook.entry.length,
      context 
    });

    for (const entry of webhook.entry) {
      for (const messaging of entry.messaging) {
        if (!messaging.delivery) {
          continue;
        }

        const delivery = messaging.delivery;
        
        logger.info('Instagram message delivery confirmed', {
          recipientId: messaging.recipient.id,
          senderId: messaging.sender.id,
          messageIds: delivery.mids,
          watermark: delivery.watermark,
          timestamp: messaging.timestamp
        });

        // Here you could update message status in your database
        // For example: mark messages as delivered
        // await updateMessageStatus(delivery.mids, 'delivered');
      }
    }
  } catch (error) {
    logger.error('Error processing Instagram message delivery webhook', { error, webhook });
    throw error;
  }
}