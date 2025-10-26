/**
 * Instagram Comments Handler
 * Handles incoming Instagram comment webhooks
 */

import { InstagramCommentWebhook, InstagramMentionWebhook, InstagramHandlerContext } from '../types';
import { autoDMService } from '../../../services/auto-dm';
import logger from '../../../utils/logger';

export async function handleComments(webhook: InstagramCommentWebhook, context: InstagramHandlerContext): Promise<void> {
  try {
    logger.info('Processing Instagram comment webhook', { 
      entryCount: webhook.entry.length,
      context 
    });

    for (const entry of webhook.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'comments') {
          continue;
        }

        const comment = change.value;
        
        // Create incoming message object for comment
        const incomingMessage = {
          senderId: comment.from.id,
          recipientId: entry.id, // The page/account receiving the comment
          text: comment.text,
          messageId: comment.id,
          platform: 'instagram' as const,
          timestamp: new Date(entry.time),
          entryId: entry.id,
          metadata: {
            type: 'comment' as const,
            mediaId: comment.media.id,
            mediaType: comment.media.media_product_type,
            parentCommentId: comment.parent_id,
            username: comment.from.username
          }
        };


        // Process through auto-DM service
        await autoDMService.processIncomingMessage(incomingMessage);
        
        logger.info('Instagram comment processed successfully', {
          commentId: comment.id,
          senderId: comment.from.id,
          mediaId: comment.media.id
        });
      }
    }
  } catch (error) {
    logger.error('Error processing Instagram comment webhook', { error, webhook });
    throw error;
  }
}

export async function handleCommentMentions(webhook: InstagramCommentWebhook, context: InstagramHandlerContext): Promise<void> {
  try {
    logger.info('Processing Instagram comment mention webhook', { 
      entryCount: webhook.entry.length,
      context 
    });

    for (const entry of webhook.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'comments') {
          continue;
        }

        const comment = change.value;
        
        // Check if this is a mention (contains @ symbol)
        if (!comment.text.includes('@')) {
          continue;
        }

        // Create incoming message object for mention
        const incomingMessage = {
          senderId: comment.from.id,
          recipientId: entry.id,
          text: comment.text,
          messageId: comment.id,
          platform: 'instagram' as const,
          timestamp: new Date(entry.time),
          entryId: entry.id,
          metadata: {
            type: 'mention' as const,
            mediaId: comment.media.id,
            mediaType: comment.media.media_product_type,
            parentCommentId: comment.parent_id,
            username: comment.from.username
          }
        };

        // Process through auto-DM service
        await autoDMService.processIncomingMessage(incomingMessage);
        
        logger.info('Instagram comment mention processed successfully', {
          commentId: comment.id,
          senderId: comment.from.id,
          mediaId: comment.media.id
        });
      }
    }
  } catch (error) {
    logger.error('Error processing Instagram comment mention webhook', { error, webhook });
    throw error;
  }
}

export async function handleMentions(webhook: InstagramMentionWebhook, context: InstagramHandlerContext): Promise<void> {
  try {
    logger.info('Processing Instagram mention webhook', { 
      entryCount: webhook.entry.length,
      context 
    });

    for (const entry of webhook.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'mentions') {
          continue;
        }

        const mention = change.value;
        
        // Create incoming message object for mention
        const incomingMessage = {
          senderId: mention.from.id,
          recipientId: entry.id,
          text: mention.text,
          messageId: mention.comment_id || `mention_${mention.media_id}_${Date.now()}`,
          platform: 'instagram' as const,
          timestamp: new Date(mention.created_time),
          entryId: entry.id,
          metadata: {
            type: 'mention' as const,
            mediaId: mention.media_id,
            commentId: mention.comment_id,
            username: mention.from.username
          }
        };

        // Process through auto-DM service
        await autoDMService.processIncomingMessage(incomingMessage);
        
        logger.info('Instagram mention processed successfully', {
          mediaId: mention.media_id,
          senderId: mention.from.id,
          commentId: mention.comment_id
        });
      }
    }
  } catch (error) {
    logger.error('Error processing Instagram mention webhook', { error, webhook });
    throw error;
  }
}