/**
 * Comments webhook event handler
 * Handles incoming comments on Instagram posts
 * Based on: https://developers.facebook.com/docs/instagram-api/webhooks
 */

import logger from '../../../utils/logger';
import { autoDMService, IncomingMessage } from '../../auto-dm';

export interface CommentEvent {
  field: string;
  value: {
    from: {
      id: string;
      username: string;
    };
    media: {
      id: string;
      media_product_type: string;
    };
    id: string;
    parent_id?: string;
    text: string;
  };
}

/**
 * Handle comment events
 */
export async function handleComments(entryId: string, commentEvent: CommentEvent): Promise<void> {
  try {
    logger.info('Processing comment event', {
      entryId,
      commentId: commentEvent.value.id,
      mediaId: commentEvent.value.media.id,
      fromUserId: commentEvent.value.from.id,
      fromUsername: commentEvent.value.from.username,
      hasText: !!commentEvent.value.text,
      isReply: !!commentEvent.value.parent_id
    });

    // Skip if no text content
    if (!commentEvent.value.text) {
      logger.debug('Skipping comment without text content', {
        commentId: commentEvent.value.id
      });
      return;
    }

    // Create incoming message object for auto-DM processing
    const incomingMessage: IncomingMessage = {
      senderId: commentEvent.value.from.id,
      recipientId: entryId, // The Instagram business account ID
      text: commentEvent.value.text,
      messageId: commentEvent.value.id,
      platform: 'instagram',
      timestamp: new Date(),
      entryId: entryId,
      metadata: {
        type: 'comment',
        mediaId: commentEvent.value.media.id,
        mediaType: commentEvent.value.media.media_product_type,
        parentCommentId: commentEvent.value.parent_id,
        username: commentEvent.value.from.username
      }
    };

    // Process with auto-DM service
    logger.debug('Processing comment for auto-DM', {
      senderId: incomingMessage.senderId,
      text: incomingMessage.text.substring(0, 100) + '...',
      commentId: commentEvent.value.id
    });

    const result = await autoDMService.processIncomingMessage(incomingMessage);

    if (result.success) {
      logger.info('Auto-DM triggered for comment', {
        commentId: commentEvent.value.id,
        automationId: result.automationId,
        responseText: result.responseText?.substring(0, 100) + '...'
      });
    } else {
      logger.debug('No auto-DM triggered for comment', {
        commentId: commentEvent.value.id,
        reason: result.error || 'No matching automation'
      });
    }

  } catch (error) {
    logger.error('Error processing comment event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      entryId,
      commentId: commentEvent.value?.id,
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

/**
 * Handle comment mentions (when someone mentions the business account in a comment)
 */
export async function handleCommentMentions(entryId: string, mentionEvent: any): Promise<void> {
  try {
    logger.info('Processing comment mention event', {
      entryId,
      mentionEvent
    });

    // TODO: Implement mention-specific logic
    // For now, treat mentions similar to regular comments
    if (mentionEvent.field === 'mentions' && mentionEvent.value) {
      await handleComments(entryId, {
        field: 'comments',
        value: mentionEvent.value
      });
    }

  } catch (error) {
    logger.error('Error processing comment mention event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      entryId,
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

export default {
  handleComments,
  handleCommentMentions
};