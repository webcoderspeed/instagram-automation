/**
 * Auto DM Service
 * Handles automatic direct message responses based on automation rules
 * Processes incoming messages and triggers appropriate automated responses
 */

import logger from '../../utils/logger';
import { AutomationModel, AutomationDocument } from '../../models/automation.model';
import { PlatformAccountModel } from '../../models/platform-account.model';
import { messagingService } from '../messaging';
import { Types } from 'mongoose';

export interface IncomingMessage {
  senderId: string;
  recipientId: string;
  text: string;
  messageId: string;
  platform: 'instagram' | 'facebook' | 'twitter';
  timestamp: Date;
  entryId: string;
  metadata?: {
    type?: 'message' | 'comment' | 'mention';
    mediaId?: string;
    mediaType?: string;
    parentCommentId?: string;
    username?: string;
    [key: string]: any;
  };
}

export interface AutoDMMatch {
  automation: AutomationDocument;
  confidence: number;
  matchedKeywords: string[];
  triggerType: 'keyword' | 'condition' | 'default';
}

export interface AutoDMResponse {
  success: boolean;
  message?: string;
  error?: string;
  automationId?: string;
  responseText?: string;
}

export class AutoDMService {
  private isInitialized = false;

  constructor() {
    this.isInitialized = true;
    logger.info('Auto DM service initialized');
  }

  /**
   * Process incoming message and trigger auto DM if matching automation found
   */
  async processIncomingMessage(message: IncomingMessage): Promise<AutoDMResponse> {
    try {
      if (!this.isInitialized) {
        throw new Error('Auto DM service not initialized');
      }

      logger.info('Processing incoming message for auto DM', {
        senderId: message.senderId,
        recipientId: message.recipientId,
        messageId: message.messageId,
        platform: message.platform,
        hasText: !!message.text
      });

      // Find platform account for the recipient
      const platformAccount = await this.findPlatformAccount(message.recipientId, message.platform);
      if (!platformAccount) {
        logger.debug('No platform account found for recipient', {
          recipientId: message.recipientId,
          platform: message.platform
        });
        return { success: false, error: 'Platform account not found' };
      }

      // Find matching automations
      const matches = await this.findMatchingAutomations(message, platformAccount.userId);
      if (matches.length === 0) {
        logger.debug('No matching automations found', {
          senderId: message.senderId,
          recipientId: message.recipientId,
          text: message.text
        });
        return { success: false, message: 'No matching automations found' };
      }

      // Select best match (highest confidence)
      const bestMatch = matches.sort((a, b) => b.confidence - a.confidence)[0];
      
      logger.info('Found matching automation for auto DM', {
        automationId: bestMatch.automation._id,
        automationName: bestMatch.automation.name,
        confidence: bestMatch.confidence,
        matchedKeywords: bestMatch.matchedKeywords,
        triggerType: bestMatch.triggerType
      });

      // Execute auto DM response
      const response = await this.executeAutoDM(message, bestMatch);
      
      // Update automation analytics
      await this.updateAutomationAnalytics(bestMatch.automation, response.success);

      return response;

    } catch (error) {
      logger.error('Error processing incoming message for auto DM', {
        error: error instanceof Error ? error.message : 'Unknown error',
        senderId: message.senderId,
        messageId: message.messageId
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Find platform account by recipient ID and platform
   */
  private async findPlatformAccount(recipientId: string, platform: string) {
    try {
      const platformAccount = await PlatformAccountModel.findOne({
        platform,
        id: recipientId,
        isActive: true
      }).populate('userId');

      return platformAccount;
    } catch (error) {
      logger.error('Error finding platform account', {
        error: error instanceof Error ? error.message : 'Unknown error',
        recipientId,
        platform
      });
      return null;
    }
  }

  /**
   * Find automations that match the incoming message
   */
  private async findMatchingAutomations(
    message: IncomingMessage, 
    userId: Types.ObjectId
  ): Promise<AutoDMMatch[]> {
    try {
      // Find active auto-reply automations for the user
      const automations = await AutomationModel.find({
        userId,
        'trigger.type': 'instagram.message_received',
        status: 'active',
        deletedAt: null
      });

      const matches: AutoDMMatch[] = [];

      for (const automation of automations) {
        const match = await this.evaluateAutomationMatch(message, automation);
        if (match) {
          matches.push(match);
        }
      }

      return matches;
    } catch (error) {
      logger.error('Error finding matching automations', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        messageText: message.text
      });
      return [];
    }
  }

  /**
   * Evaluate if an automation matches the incoming message
   */
  private async evaluateAutomationMatch(
    message: IncomingMessage,
    automation: AutomationDocument
  ): Promise<AutoDMMatch | null> {
    try {
      const messageText = message.text.toLowerCase();
      let confidence = 0;
      let matchedKeywords: string[] = [];
      let triggerType: 'keyword' | 'condition' | 'default' = 'default';

      // Check automation trigger config for keywords (only for Instagram message triggers)
      if (automation.trigger.type === 'instagram.message_received' && 
          'keywords' in automation.trigger.config && 
          automation.trigger.config.keywords) {
        const keywords = Array.isArray(automation.trigger.config.keywords) 
          ? automation.trigger.config.keywords 
          : [automation.trigger.config.keywords];

        for (const keyword of keywords) {
          const keywordLower = keyword.toString().toLowerCase();
          if (messageText.includes(keywordLower)) {
            matchedKeywords.push(keyword.toString());
            confidence += 0.8; // High confidence for exact keyword match
            triggerType = 'keyword';
          }
        }
      }

      // Check automation conditions
      if (automation.conditions) {
        for (const condition of automation.conditions) {
          if (condition.field === 'message_text' && condition.operator === 'contains') {
            const value = condition.value?.toString().toLowerCase();
            if (value && messageText.includes(value)) {
              matchedKeywords.push(value);
              confidence += 0.5;
              triggerType = 'condition';
            }
          }
        }
      }

      // Return match if confidence is above threshold
      if (confidence > 0.2) {
        return {
          automation,
          confidence,
          matchedKeywords,
          triggerType
        };
      }

      return null;
    } catch (error) {
      logger.error('Error evaluating automation match', {
        error: error instanceof Error ? error.message : 'Unknown error',
        automationId: automation._id,
        messageText: message.text
      });
      return null;
    }
  }

  /**
   * Execute auto DM response
   */
  private async executeAutoDM(
    message: IncomingMessage,
    match: AutoDMMatch
  ): Promise<AutoDMResponse> {
    try {
      const automation = match.automation;
      
      // Find the reply action in automation config
      const replyAction = automation.actions.find(
        (action: any) => action.type === 'instagram.send_message' || action.type === 'send_message'
      );

      if (!replyAction) {
        logger.warn('No reply action found in automation', {
          automationId: automation._id
        });
        return { success: false, error: 'No reply action configured' };
      }

      // Get reply text from action config
      let replyText: string = (replyAction as any).config?.message || (replyAction as any).config?.text || 'Thank you for your message!';
      
      // Replace variables in reply text
      replyText = await this.replaceVariables(replyText, message, match);

      // Send the reply message
      const sendResult = await this.sendReplyMessage(message, replyText);

      if (sendResult.success) {
        logger.info('Auto DM sent successfully', {
          automationId: automation._id,
          senderId: message.senderId,
          replyText: replyText.substring(0, 100) + '...'
        });

        return {
          success: true,
          message: 'Auto DM sent successfully',
          automationId: (automation._id as any).toString(),
          responseText: replyText
        };
      } else {
        return {
          success: false,
          error: sendResult.error || 'Failed to send reply message'
        };
      }

    } catch (error) {
      logger.error('Error executing auto DM', {
        error: error instanceof Error ? error.message : 'Unknown error',
        automationId: match.automation._id,
        senderId: message.senderId
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Replace variables in reply text
   */
  private async replaceVariables(
    text: string,
    message: IncomingMessage,
    match: AutoDMMatch
  ): Promise<string> {
    try {
      let replacedText = text;

      // Replace common variables
      replacedText = replacedText.replace(/\{sender_id\}/g, message.senderId);
      replacedText = replacedText.replace(/\{message_text\}/g, message.text);
      replacedText = replacedText.replace(/\{matched_keywords\}/g, match.matchedKeywords.join(', '));
      replacedText = replacedText.replace(/\{timestamp\}/g, message.timestamp.toISOString());
      replacedText = replacedText.replace(/\{platform\}/g, message.platform);

      // Replace date/time variables
      const now = new Date();
      replacedText = replacedText.replace(/\{current_time\}/g, now.toLocaleTimeString());
      replacedText = replacedText.replace(/\{current_date\}/g, now.toLocaleDateString());

      return replacedText;
    } catch (error) {
      logger.error('Error replacing variables in reply text', {
        error: error instanceof Error ? error.message : 'Unknown error',
        originalText: text
      });
      return text; // Return original text if replacement fails
    }
  }

  /**
   * Send reply message
   */
  private async sendReplyMessage(
    message: IncomingMessage,
    replyText: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find platform account for the recipient to get access token
      const platformAccount = await this.findPlatformAccount(message.recipientId, message.platform);
      if (!platformAccount) {
        logger.error('Platform account not found for sending reply', {
          recipientId: message.recipientId,
          platform: message.platform
        });
        return {
          success: false,
          error: 'Platform account not found'
        };
      }

      // Get access token (need to explicitly select it since it's excluded by default)
      const accountWithToken = await PlatformAccountModel
        .findById(platformAccount._id)
        .select('+accessToken')
        .exec();

      if (!accountWithToken || !accountWithToken.accessToken) {
        logger.error('Access token not found for platform account', {
          accountId: platformAccount._id,
          platform: message.platform
        });
        return {
          success: false,
          error: 'Access token not found'
        };
      }

      // Use the messaging service to send the reply
      const result = await messagingService.sendTextMessage(
        message.senderId,
        replyText,
        message.platform,
        accountWithToken.accessToken,
        accountWithToken.id // Instagram user ID
      );

      return { success: result.success, error: result.error };
    } catch (error) {
      logger.error('Error sending reply message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        senderId: message.senderId,
        platform: message.platform
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update automation analytics
   */
  private async updateAutomationAnalytics(
    automation: AutomationDocument,
    success: boolean
  ): Promise<void> {
    try {
      const executionResult = {
        executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        automationId: (automation._id as any).toString(),
        success,
        executedAt: new Date(),
        executionTime: 0, // 0 execution time for now
        actionsExecuted: 1,
        actionsSuccessful: success ? 1 : 0,
        actionsFailed: success ? 0 : 1,
        logs: [{
          timestamp: new Date(),
          level: (success ? 'info' : 'error') as 'info' | 'error' | 'warn',
          message: success ? 'Auto-DM sent successfully' : 'Auto-DM failed to send'
        }]
      };

      await automation.updateAnalytics(executionResult);

      logger.debug('Updated automation analytics', {
        automationId: automation._id,
        success,
        executionCount: automation.executionStats.totalExecutions,
        successCount: automation.executionStats.successfulExecutions,
        failureCount: automation.executionStats.failedExecutions
      });

    } catch (error) {
      logger.error('Error updating automation analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        automationId: automation._id
      });
    }
  }

  /**
   * Get service status
   */
  getStatus(): { initialized: boolean; activeAutomations?: number } {
    return {
      initialized: this.isInitialized
    };
  }
}

// Export singleton instance
export const autoDMService = new AutoDMService();