/**
 * Comment Automation Handler
 * Handles Instagram comment-based automations with strict media ID matching
 */

import { BaseAutomationHandler } from './base-handler';
import { AutomationDocument } from '../../../models/automation.model';
import { PlatformAccountModel } from '../../../models/platform-account.model';
import { messagingService } from '../../../services/messaging';
import logger from '../../../utils/logger';
import {
  AUTOMATION_TRIGGER_TYPES,
  AUTOMATION_ACTION_TYPES,
  IncomingWebhookMessage,
  AutomationMatch,
  AutomationHandlerContext,
  CommentTriggerConfig,
  ReplyToCommentActionConfig,
  SendMessageActionConfig,
  LikeCommentActionConfig,
  HideCommentActionConfig
} from './types';

export class CommentAutomationHandler extends BaseAutomationHandler {
  triggerType = AUTOMATION_TRIGGER_TYPES.INSTAGRAM_COMMENT_RECEIVED;

  /**
   * Check if this handler can process the given message
   */
  canHandle(message: IncomingWebhookMessage): boolean {
    return message.metadata.type === 'comment' && 
           message.platform === 'instagram' &&
           !!message.metadata.mediaId;
  }

  /**
   * Evaluate if an automation matches the incoming comment
   */
  protected async evaluateAutomationMatch(
    message: IncomingWebhookMessage,
    automation: AutomationDocument,
    context: AutomationHandlerContext
  ): Promise<AutomationMatch | null> {
    try {
      const triggerConfig = automation.trigger.config as CommentTriggerConfig;
      const messageText = message.text.toLowerCase();
      let confidence = 0;
      const matchedKeywords: string[] = [];
      const matchedConditions: string[] = [];

      // 1. STRICT MEDIA ID MATCHING (HIGHEST PRIORITY)
      if (triggerConfig.mediaIds && triggerConfig.mediaIds.length > 0) {
        const messageMediaId = message.metadata.mediaId;
        
        if (!messageMediaId) {
          logger.debug('Comment missing mediaId, skipping automation', {
            automationId: String(automation._id),
            messageId: message.messageId
          });
          return null;
        }

        const mediaIdMatch = triggerConfig.mediaIds.includes(messageMediaId);
        if (!mediaIdMatch) {
          logger.debug('Comment media ID does not match automation configuration', {
            automationId: String(automation._id),
            messageMediaId,
            configuredMediaIds: triggerConfig.mediaIds
          });
          return null;
        }

        confidence += 0.5; // High confidence for media ID match
        matchedConditions.push('media_id_match');
        
        logger.debug('Media ID match found for comment automation', {
          automationId: String(automation._id),
          messageMediaId,
          configuredMediaIds: triggerConfig.mediaIds
        });
      }

      // 2. MEDIA TYPE FILTERING
      if (triggerConfig.mediaTypes && triggerConfig.mediaTypes.length > 0) {
        const messageMediaType = message.metadata.mediaType;
        if (messageMediaType && !triggerConfig.mediaTypes.includes(messageMediaType as any)) {
          logger.debug('Comment media type does not match automation configuration', {
            automationId: String(automation._id),
            messageMediaType,
            configuredMediaTypes: triggerConfig.mediaTypes
          });
          return null;
        }
        confidence += 0.1;
        matchedConditions.push('media_type_match');
      }

      // 3. PARENT COMMENT FILTERING
      if (triggerConfig.parentCommentOnly === true && message.metadata.parentCommentId) {
        logger.debug('Automation configured for parent comments only, but this is a reply', {
          automationId: String(automation._id),
          parentCommentId: message.metadata.parentCommentId
        });
        return null;
      }

      if (triggerConfig.parentCommentOnly === false && !message.metadata.parentCommentId) {
        logger.debug('Automation configured for reply comments only, but this is a parent comment', {
          automationId: String(automation._id)
        });
        return null;
      }

      // 4. EXCLUDE KEYWORDS CHECK (BLOCKING)
      if (triggerConfig.excludeKeywords && triggerConfig.excludeKeywords.length > 0) {
        const excludeResult = this.checkKeywordMatch(
          messageText,
          [],
          triggerConfig.excludeKeywords,
          triggerConfig.exactMatch || false,
          triggerConfig.caseSensitive || false
        );

        if (excludeResult.matched) {
          logger.debug('Comment contains excluded keywords, skipping automation', {
            automationId: String(automation._id),
            messageText: message.text,
            excludedKeywords: excludeResult.matchedKeywords
          });
          return null;
        }
      }

      // 5. INCLUDE KEYWORDS CHECK
      if (triggerConfig.keywords && triggerConfig.keywords.length > 0) {
        const keywordResult = this.checkKeywordMatch(
          messageText,
          triggerConfig.keywords,
          [],
          triggerConfig.exactMatch || false,
          triggerConfig.caseSensitive || false
        );

        if (!keywordResult.matched) {
          logger.debug('Comment does not match required keywords', {
            automationId: String(automation._id),
            messageText: message.text,
            requiredKeywords: triggerConfig.keywords
          });
          return null;
        }

        confidence += keywordResult.confidence * 0.4; // Keywords contribute to confidence
        matchedKeywords.push(...keywordResult.matchedKeywords);
        matchedConditions.push('keyword_match');
      }

      // 6. AUTHOR FILTERING
      if (triggerConfig.authorFilters) {
        const authorFilterResult = await this.checkAuthorFilters(
          message,
          triggerConfig.authorFilters,
          context
        );

        if (!authorFilterResult.passed) {
          logger.debug('Comment author does not meet filter criteria', {
            automationId: String(automation._id),
            senderId: message.senderId,
            filterReason: authorFilterResult.reason
          });
          return null;
        }

        confidence += 0.1;
        matchedConditions.push('author_filter_match');
      }

      // 7. MINIMUM CONFIDENCE CHECK
      if (confidence < 0.3) {
        logger.debug('Automation confidence too low', {
          automationId: String(automation._id),
          confidence,
          requiredMinimum: 0.3
        });
        return null;
      }

      // Determine trigger type based on what matched
      let triggerType: 'keyword' | 'condition' | 'media' | 'default' = 'default';
      if (matchedKeywords.length > 0) {
        triggerType = 'keyword';
      } else if (matchedConditions.includes('media_id_match')) {
        triggerType = 'media';
      } else if (matchedConditions.length > 0) {
        triggerType = 'condition';
      }

      logger.info('Comment automation match found', {
        automationId: String(automation._id),
        automationName: automation.name,
        confidence,
        matchedKeywords,
        matchedConditions,
        triggerType
      });

      return {
        automation,
        confidence,
        matchedKeywords,
        triggerType,
        matchedConditions
      };

    } catch (error) {
      logger.error('Error evaluating comment automation match', {
        error: error instanceof Error ? error.message : 'Unknown error',
        automationId: String(automation._id),
        messageId: message.messageId
      });
      return null;
    }
  }

  /**
   * Check author filters for the comment
   */
  private async checkAuthorFilters(
    message: IncomingWebhookMessage,
    authorFilters: CommentTriggerConfig['authorFilters'],
    context: AutomationHandlerContext
  ): Promise<{ passed: boolean; reason?: string }> {
    try {
      // For now, we'll implement basic filtering
      // In a real implementation, you'd fetch user data from Instagram API
      
      if (authorFilters?.includeVerified === true) {
        // Would need to check if user is verified via Instagram API
        // For now, assume all users pass this check
      }

      if (authorFilters?.excludeVerified === true) {
        // Would need to check if user is verified via Instagram API
        // For now, assume all users pass this check
      }

      if (authorFilters?.minFollowers || authorFilters?.maxFollowers) {
        // Would need to fetch follower count via Instagram API
        // For now, assume all users pass this check
      }

      return { passed: true };

    } catch (error) {
      logger.error('Error checking author filters', {
        error: error instanceof Error ? error.message : 'Unknown error',
        senderId: message.senderId
      });
      return { passed: true }; // Default to allowing if we can't check
    }
  }

  /**
   * Execute reply to comment action
   */
  protected async executeReplyToCommentAction(
    config: ReplyToCommentActionConfig,
    message: IncomingWebhookMessage,
    context: AutomationHandlerContext
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!config.replyText) {
        return { success: false, error: 'Reply text is required' };
      }

      // Get platform account with access token
      const platformAccount = await PlatformAccountModel.findById(context.platformAccountId);
      if (!platformAccount || !platformAccount.accessToken) {
        return { success: false, error: 'Platform account or access token not found' };
      }

      // Apply variable replacements
      const processedReplyText = this.applyVariableReplacements(config.replyText, {
        username: message.metadata.username || 'User',
        comment_text: message.text,
        media_id: message.metadata.mediaId || '',
        timestamp: message.timestamp.toISOString()
      });

      // Handle delay if specified
      if (config.delay != null && config.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, config.delay! * 1000));
      }

      // Send reply via messaging service (using private reply)
      const result = await messagingService.sendPrivateReply({
        commentId: message.messageId,
        message: processedReplyText,
        accessToken: platformAccount.accessToken,
        instagramUserId: platformAccount.id
      });

      if (result) {
        logger.info('Comment reply sent successfully', {
          commentId: message.messageId,
          replyText: processedReplyText,
          messageId: result.message_id
        });
        return { success: true };
      } else {
        return { success: false, error: 'Failed to send comment reply' };
      }

    } catch (error) {
      logger.error('Error executing reply to comment action', {
        error: error instanceof Error ? error.message : 'Unknown error',
        commentId: message.messageId
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Execute send message action (DM the commenter)
   */
  protected async executeSendMessageAction(
    config: SendMessageActionConfig,
    message: IncomingWebhookMessage,
    context: AutomationHandlerContext
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!config.message) {
        return { success: false, error: 'Message text is required' };
      }

      // Get platform account with access token
      const platformAccount = await PlatformAccountModel.findById(context.platformAccountId);
      if (!platformAccount || !platformAccount.accessToken) {
        return { success: false, error: 'Platform account or access token not found' };
      }

      // Apply variable replacements
      const processedMessage = this.applyVariableReplacements(config.message, {
        username: message.metadata.username || 'User',
        comment_text: message.text,
        media_id: message.metadata.mediaId || '',
        timestamp: message.timestamp.toISOString()
      });

      // Add delay if specified
      if (config.delay != null && config.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, config.delay! * 1000));
      }

      // Send direct message via messaging service
      const result = await messagingService.sendDirectMessage({
        recipientId: message.senderId,
        message: processedMessage,
        accessToken: platformAccount.accessToken,
        instagramUserId: platformAccount.id
      });

      if (result) {
        logger.info('Direct message sent successfully', {
          recipientId: message.senderId,
          messageLength: processedMessage.length,
          messageId: result.message_id
        });
        return { success: true };
      } else {
        return { success: false, error: 'Failed to send direct message' };
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
   * Execute like comment action
   */
  protected async executeLikeCommentAction(
    config: LikeCommentActionConfig,
    message: IncomingWebhookMessage,
    context: AutomationHandlerContext
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get platform account with access token
      const platformAccount = await PlatformAccountModel.findById(context.platformAccountId);
      if (!platformAccount || !platformAccount.accessToken) {
        return { success: false, error: 'Platform account or access token not found' };
      }

      // Add delay if specified
      if (config.delay != null && config.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, config.delay! * 1000));
      }

      // TODO: Implement like comment via Instagram Graph API
      // For now, this is a placeholder implementation
      logger.info('Like comment action executed (placeholder)', {
        commentId: message.messageId
      });
      
      return { success: true };

    } catch (error) {
      logger.error('Error executing like comment action', {
        error: error instanceof Error ? error.message : 'Unknown error',
        commentId: message.messageId
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Execute hide comment action
   */
  protected async executeHideCommentAction(
    config: HideCommentActionConfig,
    message: IncomingWebhookMessage,
    context: AutomationHandlerContext
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get platform account with access token
      const platformAccount = await PlatformAccountModel.findById(context.platformAccountId);
      if (!platformAccount || !platformAccount.accessToken) {
        return { success: false, error: 'Platform account or access token not found' };
      }

      // Add delay if specified
      if (config.delay != null && config.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, config.delay! * 1000));
      }

      // TODO: Implement hide comment via Instagram Graph API
      // For now, this is a placeholder implementation
      logger.info('Hide comment action executed (placeholder)', {
        commentId: message.messageId
      });
      
      return { success: true };

    } catch (error) {
      logger.error('Error executing hide comment action', {
        error: error instanceof Error ? error.message : 'Unknown error',
        commentId: message.messageId
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Apply variable replacements to text
   */
  private applyVariableReplacements(text: string, variables: Record<string, string>): string {
    let processedText = text;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedText = processedText.replace(regex, value);
    }
    
    return processedText;
  }
}