/**
 * Instagram Webhook Module
 * Main entry point for Instagram webhook handling
 */

export * from './types';
export * from './handlers';

// Main Instagram webhook processor
import { InstagramMessageWebhook, InstagramCommentWebhook, InstagramMentionWebhook, InstagramHandlerContext, InstagramWebhookPayload } from './types';
import { instagramHandlers } from './handlers';
import logger from '../../utils/logger';

export class InstagramWebhookProcessor {
  // Type guard functions
  private isMessageWebhook(payload: InstagramWebhookPayload): payload is InstagramMessageWebhook {
    return 'entry' in payload && 
           Array.isArray(payload.entry) && 
           payload.entry.length > 0 && 
           'messaging' in payload.entry[0];
  }

  private isCommentWebhook(payload: InstagramWebhookPayload): payload is InstagramCommentWebhook {
    return 'entry' in payload && 
           Array.isArray(payload.entry) && 
           payload.entry.length > 0 && 
           'changes' in payload.entry[0] &&
           Array.isArray(payload.entry[0].changes) &&
           payload.entry[0].changes.some(change => change.field === 'comments');
  }

  private isMentionWebhook(payload: InstagramWebhookPayload): payload is InstagramMentionWebhook {
    return 'entry' in payload && 
           Array.isArray(payload.entry) && 
           payload.entry.length > 0 && 
           'changes' in payload.entry[0] &&
           Array.isArray(payload.entry[0].changes) &&
           payload.entry[0].changes.some(change => change.field === 'mentions');
  }

  async processWebhook(payload: InstagramWebhookPayload, context: InstagramHandlerContext): Promise<void> {
    try {
      const object = payload.object;
      
      if (object !== 'instagram') {
        throw new Error(`Invalid webhook object type: ${object}`);
      }

      // Determine webhook type using type guards
      if (this.isMessageWebhook(payload)) {
        // Message webhook
        await instagramHandlers.messages(payload, context);
      } else if (this.isCommentWebhook(payload)) {
        // Comment webhook
        await instagramHandlers.comments(payload, context);
      } else if (this.isMentionWebhook(payload)) {
        // Mention webhook
        await instagramHandlers.mentions(payload, context);
      } else {
        logger.warn('Unknown Instagram webhook payload structure', { payload });
      }
    } catch (error) {
      logger.error('Error processing Instagram webhook', { error, payload });
      throw error;
    }
  }
}