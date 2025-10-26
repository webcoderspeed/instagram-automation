/**
 * Instagram Messaging Seen Handler
 * Handles Instagram message read receipts
 */

import { InstagramMessageWebhook, InstagramHandlerContext } from '../types';
import logger from '../../../utils/logger';

export async function handleMessagingSeen(webhook: InstagramMessageWebhook, context: InstagramHandlerContext): Promise<void> {
  try {
    logger.info('Processing Instagram messaging seen webhook', { 
      entryCount: webhook.entry.length,
      context 
    });

    for (const entry of webhook.entry) {
      for (const messaging of entry.messaging) {
        if (!messaging.read) {
          continue;
        }

        const read = messaging.read;
        
        logger.info('Instagram message read receipt', {
          senderId: messaging.sender.id,
          recipientId: messaging.recipient.id,
          watermark: read.watermark,
          timestamp: messaging.timestamp
        });

        // Here you could update message status in your database
        // For example: mark messages as read up to the watermark
        // await updateMessageReadStatus(messaging.sender.id, read.watermark);
      }
    }
  } catch (error) {
    logger.error('Error processing Instagram messaging seen webhook', { error, webhook });
    throw error;
  }
}