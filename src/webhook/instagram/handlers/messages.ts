/**
 * Instagram Messages Handler
 * Handles incoming Instagram message webhooks
 */

import { InstagramMessageWebhook, InstagramHandlerContext } from '../types';
import { autoDMService } from '../../../services/auto-dm';
import logger from '../../../utils/logger';

export async function handleMessages(webhook: InstagramMessageWebhook, context: InstagramHandlerContext): Promise<void> {
  try {
    logger.info('Processing Instagram message webhook', { 
      entryCount: webhook.entry.length,
      context 
    });

    for (const entry of webhook.entry) {
      for (const messaging of entry.messaging) {
        // Skip if no message content
        if (!messaging.message?.text && !messaging.message?.attachments) {
          continue;
        }

        // Create incoming message object
        const incomingMessage = {
          senderId: messaging.sender.id,
          recipientId: messaging.recipient.id,
          text: messaging.message?.text || '',
          messageId: messaging.message?.mid || '',
          platform: 'instagram' as const,
          timestamp: new Date(messaging.timestamp),
          entryId: entry.id,
          metadata: {
            type: 'message' as const,
            hasAttachments: !!messaging.message?.attachments?.length
          }
        };



        // Process through auto-DM service
        await autoDMService.processIncomingMessage(incomingMessage);
        
        logger.info('Instagram message processed successfully', {
          messageId: incomingMessage.messageId,
          senderId: incomingMessage.senderId
        });
      }
    }
  } catch (error) {
    logger.error('Error processing Instagram message webhook', { error, webhook });
    throw error;
  }
}