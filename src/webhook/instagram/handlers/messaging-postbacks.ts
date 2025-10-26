/**
 * Instagram Messaging Postbacks Handler
 * Handles Instagram postback events (button clicks, quick replies, etc.)
 */

import { InstagramMessageWebhook, InstagramHandlerContext } from '../types';
import { autoDMService } from '../../../services/auto-dm';
import logger from '../../../utils/logger';

export async function handleMessagingPostbacks(webhook: InstagramMessageWebhook, context: InstagramHandlerContext): Promise<void> {
  try {
    logger.info('Processing Instagram messaging postback webhook', { 
      entryCount: webhook.entry.length,
      context 
    });

    for (const entry of webhook.entry) {
      for (const messaging of entry.messaging) {
        if (!messaging.postback) {
          continue;
        }

        const postback = messaging.postback;
        
        // Create incoming message object for postback
        const incomingMessage = {
          senderId: messaging.sender.id,
          recipientId: messaging.recipient.id,
          text: postback.title || postback.payload, // Use title or payload as text
          messageId: `postback_${messaging.timestamp}`, // Generate unique ID for postback
          platform: 'instagram' as const,
          timestamp: new Date(messaging.timestamp),
          entryId: entry.id,
          metadata: {
            type: 'message' as const,
            postbackPayload: postback.payload,
            postbackTitle: postback.title,
            isPostback: true
          }
        };

        // Process through auto-DM service
        await autoDMService.processIncomingMessage(incomingMessage);
        
        logger.info('Instagram postback processed successfully', {
          senderId: messaging.sender.id,
          payload: postback.payload,
          title: postback.title
        });
      }
    }
  } catch (error) {
    logger.error('Error processing Instagram messaging postback webhook', { error, webhook });
    throw error;
  }
}