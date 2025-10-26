/**
 * Webhook Service
 * Main service for handling Facebook/Instagram webhook events
 * Routes events to appropriate handlers based on event type
 */

import logger from '../../utils/logger';
import { WebhookEvent, WebhookEntry, WebhookMessaging } from './interfaces/base';
import {
  handleMessages,
  handleMessageDeliveries,
  handleMessageReactions,
  handleMessagingSeen,
  handleMessagingPostbacks,
  handleMessagingReferrals,
  handleComments,
  handleCommentMentions
} from './handlers';

export class WebhookService {
  private isInitialized = false;

  constructor() {
    this.isInitialized = true;
    logger.info('Webhook service initialized');
  }

  /**
   * Process incoming webhook event
   */
  async processWebhookEvent(event: WebhookEvent): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Webhook service not initialized');
    }

    try {
      logger.info('Processing webhook event', {
        object: event.object,
        entryCount: event.entry.length,
        eventType: 'webhook_event'
      });

      // Process each entry in the webhook event
      for (const entry of event.entry) {
        await this.processEntry(entry);
      }

      logger.debug('Webhook event processed successfully', {
        object: event.object,
        entryCount: event.entry.length
      });

    } catch (error) {
      logger.error('Error processing webhook event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        object: event.object,
        entryCount: event.entry?.length || 0
      });
      throw error;
    }
  }

  /**
   * Process a single webhook entry
   */
  private async processEntry(entry: WebhookEntry): Promise<void> {
    try {
      logger.debug('Processing webhook entry', {
        entryId: entry.id,
        time: entry.time,
        hasMessaging: !!entry.messaging,
        hasChanges: !!entry.changes,
        hasStandby: !!entry.standby
      });

      // Process messaging events
      if (entry.messaging && entry.messaging.length > 0) {
        await this.processMessagingEvents(entry.id, entry.messaging);
      }

      // Process standby events
      if (entry.standby && entry.standby.length > 0) {
        await this.processStandbyEvents(entry.id, entry.standby);
      }

      // Process change events (for feed events, comments, etc.)
      if (entry.changes && entry.changes.length > 0) {
        await this.processChangeEvents(entry.id, entry.changes);
      }

    } catch (error) {
      logger.error('Error processing webhook entry', {
        error: error instanceof Error ? error.message : 'Unknown error',
        entryId: entry.id
      });
    }
  }

  /**
   * Process messaging events
   */
  private async processMessagingEvents(entryId: string, messagingEvents: WebhookMessaging[]): Promise<void> {
    for (const messaging of messagingEvents) {
      try {
        await this.routeMessagingEvent(entryId, messaging);
      } catch (error) {
        logger.error('Error processing messaging event', {
          error: error instanceof Error ? error.message : 'Unknown error',
          entryId,
          senderId: messaging.sender?.id
        });
      }
    }
  }

  /**
   * Route messaging event to appropriate handler
   */
  private async routeMessagingEvent(entryId: string, messaging: WebhookMessaging): Promise<void> {
    try {
      // Handle messages
      if (messaging.message) {
        logger.debug('Routing to message handler', { entryId, senderId: messaging.sender.id });
        await handleMessages(entryId, messaging);
      }

      // Handle message deliveries
      if (messaging.delivery) {
        logger.debug('Routing to delivery handler', { entryId, senderId: messaging.sender.id });
        await handleMessageDeliveries(entryId, messaging);
      }

      // Handle message reads
      if (messaging.read) {
        logger.debug('Routing to read handler', { entryId, senderId: messaging.sender.id });
        await handleMessagingSeen(entryId, messaging);
      }

      // Handle postbacks
      if (messaging.postback) {
        logger.debug('Routing to postback handler', { entryId, senderId: messaging.sender.id });
        await handleMessagingPostbacks(entryId, messaging);
      }

      // Handle referrals
      if (messaging.referral) {
        logger.debug('Routing to referral handler', { entryId, senderId: messaging.sender.id });
        await handleMessagingReferrals(entryId, messaging);
      }

      // Handle reactions
      if (messaging.reaction) {
        logger.debug('Routing to reaction handler', { entryId, senderId: messaging.sender.id });
        await handleMessageReactions(entryId, messaging);
      }

      // Handle other event types as needed
      if (messaging.optin) {
        logger.debug('Optin event received', { entryId, senderId: messaging.sender.id });
        // TODO: Implement optin handler
      }

      if (messaging.account_linking) {
        logger.debug('Account linking event received', { entryId, senderId: messaging.sender.id });
        // TODO: Implement account linking handler
      }

    } catch (error) {
      logger.error('Failed to route messaging event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        entryId,
        senderId: messaging.sender.id
      });
    }
  }

  /**
   * Process standby events (when app is in standby mode)
   */
  private async processStandbyEvents(entryId: string, standbyEvents: WebhookMessaging[]): Promise<void> {
    logger.info('Processing standby events', {
      entryId,
      eventCount: standbyEvents.length
    });

    // TODO: Implement standby event processing
    // Standby events are received when the app is not the primary receiver
    for (const standby of standbyEvents) {
      logger.debug('Standby event received', {
        entryId,
        senderId: standby.sender.id,
        hasMessage: !!standby.message,
        hasPostback: !!standby.postback
      });
    }
  }

  /**
   * Process change events (feed events, comments, etc.)
   */
  private async processChangeEvents(entryId: string, changes: any[]): Promise<void> {
    logger.info('Processing change events', {
      entryId,
      changeCount: changes.length
    });

    for (const change of changes) {
      logger.debug('Change event received', {
        entryId,
        field: change.field,
        value: change.value
      });

      try {
        // Route change events to appropriate handlers
        switch (change.field) {
          case 'comments':
            await handleComments(entryId, change);
            break;
          
          case 'mentions':
            await handleCommentMentions(entryId, change);
            break;
          
          default:
            logger.debug('Unhandled change event field', {
              entryId,
              field: change.field
            });
            break;
        }
      } catch (error) {
        logger.error('Error processing change event', {
          error: error instanceof Error ? error.message : 'Unknown error',
          entryId,
          field: change.field,
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    initialized: boolean;
    availableHandlers: string[];
  } {
    return {
      initialized: this.isInitialized,
      availableHandlers: [
        'messages',
        'message_deliveries',
        'message_reads',
        'messaging_postbacks',
        'messaging_referrals',
        'message_reactions',
        'comments',
        'mentions'
      ]
    };
  }
}

// Export singleton instance
export const webhookService = new WebhookService();