/**
 * Base Automation Handler
 * Common functionality for all automation handlers
 */

import { Types } from 'mongoose';
import { AutomationModel, AutomationDocument } from '../../../models/automation.model';
import { PlatformAccountModel } from '../../../models/platform-account.model';
import { messagingService } from '../../../services/messaging';
import logger from '../../../utils/logger';
import {
  AutomationHandler,
  AutomationTriggerType,
  IncomingWebhookMessage,
  AutomationMatch,
  AutomationExecutionResult,
  AutomationHandlerContext,
  ValidationResult,
  AUTOMATION_TRIGGER_TYPES,
  AUTOMATION_ACTION_TYPES
} from './types';

export abstract class BaseAutomationHandler implements AutomationHandler {
  abstract triggerType: AutomationTriggerType;

  abstract canHandle(message: IncomingWebhookMessage): boolean;

  /**
   * Find matching automations for the given message
   */
  async findMatchingAutomations(
    message: IncomingWebhookMessage,
    context: AutomationHandlerContext
  ): Promise<AutomationMatch[]> {
    try {
      // Find active automations for this trigger type and user
      const automations = await AutomationModel.find({
        userId: context.userId,
        'trigger.type': this.triggerType,
        status: 'active',
        platformAccountIds: context.platformAccountId,
        deletedAt: null
      }).lean();

      const matches: AutomationMatch[] = [];

      for (const automation of automations) {
        const automationDoc = automation as unknown as AutomationDocument;
        const match = await this.evaluateAutomationMatch(message, automationDoc, context);
        if (match) {
          matches.push(match);
        }
      }

      // Sort by confidence (highest first)
      return matches.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      logger.error('Error finding matching automations', {
        error: error instanceof Error ? error.message : 'Unknown error',
        triggerType: this.triggerType,
        userId: context.userId,
        messageId: message.messageId
      });
      return [];
    }
  }

  /**
   * Execute automation for the given match
   */
  async executeAutomation(
    message: IncomingWebhookMessage,
    match: AutomationMatch,
    context: AutomationHandlerContext
  ): Promise<AutomationExecutionResult> {
    const startTime = Date.now();
    const executedActions: AutomationExecutionResult['executedActions'] = [];

    try {
      logger.info('Executing automation', {
        automationId: match.automation._id,
        automationName: match.automation.name,
        triggerType: this.triggerType,
        confidence: match.confidence
      });

      // Check rate limits and execution limits
      const canExecute = await this.checkExecutionLimits(match.automation);
      if (!canExecute) {
        return {
          success: false,
          automationId: String(match.automation._id),
          executedActions: [],
          totalExecutionTime: Date.now() - startTime,
          error: 'Execution limits exceeded'
        };
      }

      // Execute each action in sequence
      for (const action of match.automation.actions) {
        const actionStartTime = Date.now();
        
        try {
          const actionResult = await this.executeAction(action, message, match, context);
          
          executedActions.push({
            type: action.type as any,
            success: actionResult.success,
            error: actionResult.error,
            executionTime: Date.now() - actionStartTime
          });

          if (!actionResult.success && match.automation.settings.stopOnError) {
            break;
          }

        } catch (actionError) {
          executedActions.push({
            type: action.type as any,
            success: false,
            error: actionError instanceof Error ? actionError.message : 'Unknown action error',
            executionTime: Date.now() - actionStartTime
          });

          if (match.automation.settings.stopOnError) {
            break;
          }
        }
      }

      // Update automation analytics
      await this.updateAutomationAnalytics(match.automation, executedActions);

      const totalExecutionTime = Date.now() - startTime;
      const success = executedActions.every(action => action.success);

      return {
        success,
        automationId: String(match.automation._id),
        executedActions,
        totalExecutionTime,
        error: success ? undefined : 'Some actions failed'
      };

    } catch (error) {
      logger.error('Error executing automation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        automationId: match.automation._id,
        messageId: message.messageId
      });

      return {
        success: false,
        automationId: String(match.automation._id),
        executedActions,
        totalExecutionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown execution error'
      };
    }
  }

  /**
   * Abstract method to evaluate if an automation matches the message
   */
  protected abstract evaluateAutomationMatch(
    message: IncomingWebhookMessage,
    automation: AutomationDocument,
    context: AutomationHandlerContext
  ): Promise<AutomationMatch | null>;

  /**
   * Execute a specific action
   */
  protected async executeAction(
    action: any,
    message: IncomingWebhookMessage,
    match: AutomationMatch,
    context: AutomationHandlerContext
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (action.type) {
        case AUTOMATION_ACTION_TYPES.INSTAGRAM_SEND_MESSAGE:
          return await this.executeSendMessageAction(action.config, message, context);
        
        case AUTOMATION_ACTION_TYPES.INSTAGRAM_REPLY_TO_COMMENT:
          return await this.executeReplyToCommentAction(action.config, message, context);
        
        case AUTOMATION_ACTION_TYPES.INSTAGRAM_LIKE_COMMENT:
          return await this.executeLikeCommentAction(action.config, message, context);
        
        case AUTOMATION_ACTION_TYPES.INSTAGRAM_HIDE_COMMENT:
          return await this.executeHideCommentAction(action.config, message, context);
        
        case AUTOMATION_ACTION_TYPES.SAVE_TO_CRM:
          return await this.executeSaveToCRMAction(action.config, message, context);
        
        case AUTOMATION_ACTION_TYPES.SEND_NOTIFICATION:
          return await this.executeSendNotificationAction(action.config, message, context);
        
        case AUTOMATION_ACTION_TYPES.TRACK_ENGAGEMENT:
          return await this.executeTrackEngagementAction(action.config, message, context);
        
        default:
          return { success: false, error: `Unsupported action type: ${action.type}` };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown action execution error' 
      };
    }
  }

  /**
   * Check if automation can be executed based on limits
   */
  protected async checkExecutionLimits(automation: AutomationDocument): Promise<boolean> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Check daily limit
    if (automation.settings.maxExecutionsPerDay) {
      const todayExecutions = automation.executionStats.totalExecutions; // Simplified - should check actual daily count
      if (todayExecutions >= automation.settings.maxExecutionsPerDay) {
        return false;
      }
    }

    // Check monthly limit
    if (automation.settings.maxExecutionsPerMonth) {
      const monthlyExecutions = automation.executionStats.totalExecutions; // Simplified - should check actual monthly count
      if (monthlyExecutions >= automation.settings.maxExecutionsPerMonth) {
        return false;
      }
    }

    // Check total limit
    if (automation.settings.maxTotalExecutions) {
      if (automation.executionStats.totalExecutions >= automation.settings.maxTotalExecutions) {
        return false;
      }
    }

    return true;
  }

  /**
   * Update automation analytics after execution
   */
  protected async updateAutomationAnalytics(
    automation: AutomationDocument,
    executedActions: AutomationExecutionResult['executedActions']
  ): Promise<void> {
    try {
      const success = executedActions.every(action => action.success);
      const totalExecutionTime = executedActions.reduce((sum, action) => sum + action.executionTime, 0);

      await AutomationModel.updateOne(
        { _id: automation._id },
        {
          $inc: {
            'executionStats.totalExecutions': 1,
            'executionStats.successfulExecutions': success ? 1 : 0,
            'executionStats.failedExecutions': success ? 0 : 1
          },
          $set: {
            'executionStats.lastExecutedAt': new Date(),
            'executionStats.averageExecutionTime': totalExecutionTime,
            'executionStats.lastError': success ? undefined : 'Some actions failed'
          }
        }
      );
    } catch (error) {
      logger.error('Error updating automation analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        automationId: automation._id
      });
    }
  }

  /**
   * Validate trigger configuration
   */
  protected validateTriggerConfig(config: any): ValidationResult {
    const errors: string[] = [];

    if (!config || typeof config !== 'object') {
      errors.push('Trigger config must be an object');
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [] };
  }

  /**
   * Check keyword matches in text
   */
  protected checkKeywordMatch(
    text: string,
    keywords: string[] = [],
    excludeKeywords: string[] = [],
    exactMatch = false,
    caseSensitive = false
  ): { matched: boolean; matchedKeywords: string[]; confidence: number } {
    const processedText = caseSensitive ? text : text.toLowerCase();
    const processedKeywords = caseSensitive ? keywords : keywords.map(k => k.toLowerCase());
    const processedExcludeKeywords = caseSensitive ? excludeKeywords : excludeKeywords.map(k => k.toLowerCase());

    // Check exclude keywords first
    for (const excludeKeyword of processedExcludeKeywords) {
      if (exactMatch ? processedText === excludeKeyword : processedText.includes(excludeKeyword)) {
        return { matched: false, matchedKeywords: [], confidence: 0 };
      }
    }

    // Check include keywords
    const matchedKeywords: string[] = [];
    for (const keyword of processedKeywords) {
      if (exactMatch ? processedText === keyword : processedText.includes(keyword)) {
        matchedKeywords.push(keyword);
      }
    }

    const matched = matchedKeywords.length > 0;
    const confidence = matched ? Math.min(matchedKeywords.length / Math.max(processedKeywords.length, 1), 1) : 0;

    return { matched, matchedKeywords, confidence };
  }

  // Action execution methods (to be implemented by specific handlers or base implementations)
  protected async executeSendMessageAction(config: any, message: IncomingWebhookMessage, context: AutomationHandlerContext): Promise<{ success: boolean; error?: string }> {
    // Base implementation - to be overridden by specific handlers
    return { success: false, error: 'Send message action not implemented' };
  }

  protected async executeReplyToCommentAction(config: any, message: IncomingWebhookMessage, context: AutomationHandlerContext): Promise<{ success: boolean; error?: string }> {
    // Base implementation - to be overridden by specific handlers
    return { success: false, error: 'Reply to comment action not implemented' };
  }

  protected async executeLikeCommentAction(config: any, message: IncomingWebhookMessage, context: AutomationHandlerContext): Promise<{ success: boolean; error?: string }> {
    // Base implementation - to be overridden by specific handlers
    return { success: false, error: 'Like comment action not implemented' };
  }

  protected async executeHideCommentAction(config: any, message: IncomingWebhookMessage, context: AutomationHandlerContext): Promise<{ success: boolean; error?: string }> {
    // Base implementation - to be overridden by specific handlers
    return { success: false, error: 'Hide comment action not implemented' };
  }

  protected async executeSaveToCRMAction(config: any, message: IncomingWebhookMessage, context: AutomationHandlerContext): Promise<{ success: boolean; error?: string }> {
    // Base implementation - to be overridden by specific handlers
    return { success: false, error: 'Save to CRM action not implemented' };
  }

  protected async executeSendNotificationAction(config: any, message: IncomingWebhookMessage, context: AutomationHandlerContext): Promise<{ success: boolean; error?: string }> {
    // Base implementation - to be overridden by specific handlers
    return { success: false, error: 'Send notification action not implemented' };
  }

  protected async executeTrackEngagementAction(config: any, message: IncomingWebhookMessage, context: AutomationHandlerContext): Promise<{ success: boolean; error?: string }> {
    // Base implementation - to be overridden by specific handlers
    return { success: false, error: 'Track engagement action not implemented' };
  }
}