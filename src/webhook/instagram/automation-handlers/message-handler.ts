import { BaseAutomationHandler } from './base-handler';
import {
  IncomingWebhookMessage,
  AutomationHandlerContext,
  AutomationMatch,
  AutomationTriggerType,
  AUTOMATION_TRIGGER_TYPES,
  AUTOMATION_ACTION_TYPES,
  SendMessageActionConfig,
  SaveToCRMActionConfig,
  SendNotificationActionConfig,
  TrackEngagementActionConfig,
  MessageTriggerConfig
} from './types';
import { AutomationDocument } from '../../../models/automation.model';
import { PlatformAccountModel } from '../../../models/platform-account.model';
import { messagingService } from '../../../services/messaging';
import logger from '../../../utils/logger';

/**
 * Handles Instagram direct message automations
 * Supports keyword matching, sender filtering, and various actions
 */
export class MessageAutomationHandler extends BaseAutomationHandler {
  triggerType: AutomationTriggerType = AUTOMATION_TRIGGER_TYPES.INSTAGRAM_MESSAGE_RECEIVED;
  
  /**
   * Check if this handler can process the incoming message
   */
  canHandle(message: IncomingWebhookMessage): boolean {
    return message.metadata.type === 'message';
  }

  /**
   * Evaluate if an automation matches the incoming message
   */
  protected async evaluateAutomationMatch(
    message: IncomingWebhookMessage,
    automation: AutomationDocument,
    context: AutomationHandlerContext
  ): Promise<AutomationMatch | null> {
    let confidence = 0;
    const matchedKeywords: string[] = [];
    const matchedConditions: string[] = [];

    // Check trigger configuration
    const trigger = automation.trigger;
    if (!trigger || trigger.type !== AUTOMATION_TRIGGER_TYPES.INSTAGRAM_MESSAGE_RECEIVED) {
      return null;
    }

    // Base confidence for message type match
    confidence += 30;
    matchedConditions.push('message_type_match');

    // Check keyword matching
    if (trigger.config.keywords && trigger.config.keywords.length > 0) {
      const keywordMatch = this.checkKeywordMatch(
        message.text,
        trigger.config.keywords,
        trigger.config.excludeKeywords || [],
        trigger.config.exactMatch || false,
        trigger.config.caseSensitive || false
      );
      
      if (!keywordMatch.matched) {
        return null; // No keyword match
      }
      
      confidence += keywordMatch.confidence;
      matchedKeywords.push(...keywordMatch.matchedKeywords);
      matchedConditions.push('keyword_match');
    }

    // Cast trigger config to MessageTriggerConfig for type safety
    const messageConfig = trigger.config as MessageTriggerConfig;
    
    // Check attachment requirement
    if (messageConfig.requireAttachment !== undefined) {
      const hasAttachment = message.metadata?.hasAttachments || false;
      if (messageConfig.requireAttachment !== hasAttachment) {
        return null;
      }
      confidence += 10;
      matchedConditions.push(hasAttachment ? 'has_attachment' : 'no_attachment');
    }

    // Ensure minimum confidence threshold
    if (confidence < 40) {
      return null;
    }

    return {
      automation,
      confidence,
      matchedKeywords,
      triggerType: matchedKeywords.length > 0 ? 'keyword' : 'condition',
      matchedConditions
    };
  }

  /**
   * Execute send message action
   */
  protected async executeSendMessageAction(
    config: SendMessageActionConfig,
    message: IncomingWebhookMessage,
    context: AutomationHandlerContext
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get platform account with access token
      const platformAccount = await PlatformAccountModel.findById(context.platformAccountId);
      if (!platformAccount || !platformAccount.accessToken) {
        return { success: false, error: 'Platform account or access token not found' };
      }

      // Process message with variable replacements
      const processedMessage = config.message
        .replace(/\{senderName\}/g, message.metadata?.username || 'User')
        .replace(/\{messageContent\}/g, message.text)
        .replace(/\{timestamp\}/g, new Date().toISOString());

      // Add delay if specified
      if (config.delay != null && config.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, config.delay));
      }

      // Send direct message via messaging service
      const result = await messagingService.sendDirectMessage({
        recipientId: message.senderId,
        message: processedMessage,
        accessToken: platformAccount.accessToken,
        instagramUserId: platformAccount.id
      });

      if (result) {
        logger.info('Auto-reply sent successfully', {
          recipientId: message.senderId,
          messageLength: processedMessage.length,
          messageId: result.message_id
        });
        return { success: true };
      } else {
        return { success: false, error: 'Failed to send auto-reply' };
      }

    } catch (error) {
      logger.error('Error executing send message action', {
        error: error instanceof Error ? error.message : 'Unknown error',
        recipientId: message.senderId
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Execute save to CRM action
   */
  protected async executeSaveToCRMAction(
    config: SaveToCRMActionConfig,
    message: IncomingWebhookMessage,
    context: AutomationHandlerContext
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implement CRM integration
      // For now, this is a placeholder implementation
      logger.info('Save to CRM action executed (placeholder)', {
        senderId: message.senderId,
        fields: config.fields,
        messageContent: message.text
      });
      
      return { success: true };

    } catch (error) {
      logger.error('Error executing save to CRM action', {
        error: error instanceof Error ? error.message : 'Unknown error',
        senderId: message.senderId
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Execute send notification action
   */
  protected async executeSendNotificationAction(
    config: SendNotificationActionConfig,
    message: IncomingWebhookMessage,
    context: AutomationHandlerContext
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implement notification service integration
      // For now, this is a placeholder implementation
      logger.info('Send notification action executed (placeholder)', {
        channels: config.channels,
        message: config.message,
        recipients: config.recipients,
        triggerMessage: message.text
      });
      
      return { success: true };

    } catch (error) {
      logger.error('Error executing send notification action', {
        error: error instanceof Error ? error.message : 'Unknown error',
        senderId: message.senderId
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Execute track engagement action
   */
  protected async executeTrackEngagementAction(
    config: TrackEngagementActionConfig,
    message: IncomingWebhookMessage,
    context: AutomationHandlerContext
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implement analytics/tracking service integration
      // For now, this is a placeholder implementation
      logger.info('Track engagement action executed (placeholder)', {
        eventType: config.eventType,
        properties: {
          ...config.properties,
          senderId: message.senderId,
          messageContent: message.text,
          timestamp: new Date().toISOString()
        }
      });
      
      return { success: true };

    } catch (error) {
      logger.error('Error executing track engagement action', {
        error: error instanceof Error ? error.message : 'Unknown error',
        senderId: message.senderId
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}