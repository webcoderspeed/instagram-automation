/**
 * Instagram Mention Automation Handler
 * Handles automation triggers for Instagram mentions and story mentions
 */

import { BaseAutomationHandler } from './base-handler';
import { AutomationDocument } from '../../../models/automation.model';
import logger from '../../../utils/logger';
import {
  AUTOMATION_TRIGGER_TYPES,
  IncomingWebhookMessage,
  AutomationMatch,
  AutomationHandlerContext,
  MentionTriggerConfig
} from './types';

export class MentionAutomationHandler extends BaseAutomationHandler {
  triggerType = AUTOMATION_TRIGGER_TYPES.INSTAGRAM_MENTION_RECEIVED;

  /**
   * Check if this handler can process the given message
   */
  canHandle(message: IncomingWebhookMessage): boolean {
    return message.metadata.type === 'mention' || message.metadata.type === 'story_mention';
  }

  /**
   * Evaluate if an automation matches the incoming mention
   */
  protected async evaluateAutomationMatch(
    message: IncomingWebhookMessage,
    automation: AutomationDocument,
    context: AutomationHandlerContext
  ): Promise<AutomationMatch | null> {
    try {
      const config = automation.trigger.config as MentionTriggerConfig;
      let confidence = 0.5; // Base confidence for mention triggers
      const reasons: string[] = [];
      const matchedKeywords: string[] = [];

      // Check keyword matching if specified
      if (config.keywords && config.keywords.length > 0) {
        const keywordMatch = this.checkKeywordMatch(
          message.text,
          config.keywords,
          config.excludeKeywords,
          config.exactMatch,
          config.caseSensitive
        );
        if (!keywordMatch.matched) {
          return null; // No match if keywords don't match
        }
        confidence += keywordMatch.confidence;
        matchedKeywords.push(...keywordMatch.matchedKeywords);
        reasons.push(`Keyword match: ${keywordMatch.matchedKeywords.join(', ')}`);
      }

      // Check media type filters if specified
      if (config.mediaTypes && config.mediaTypes.length > 0) {
        const mediaType = this.getMentionMediaType(message);
        if (!config.mediaTypes.includes(mediaType)) {
          return null; // No match if media type doesn't match filter
        }
        confidence += 0.1;
        reasons.push(`Media type match: ${mediaType}`);
      }

      // Boost confidence for story mentions (typically more intentional)
      if (message.metadata.type === 'story_mention') {
        confidence += 0.2;
        reasons.push('Story mention (high intent)');
      }

      return {
        automation,
        confidence: Math.min(confidence, 1.0),
        matchedKeywords,
        triggerType: 'keyword',
        matchedConditions: reasons
      };
    } catch (error) {
      logger.error('Error evaluating mention automation match', {
        error: error instanceof Error ? error.message : 'Unknown error',
        automationId: automation._id,
        messageId: message.messageId
      });
      return null;
    }
  }

  /**
   * Get the media type for the mention
   */
  private getMentionMediaType(message: IncomingWebhookMessage): 'FEED' | 'STORY' | 'REELS' {
    if (message.metadata.type === 'story_mention') {
      return 'STORY';
    }
    
    // For regular mentions, try to determine from metadata
    // This would need to be enhanced based on actual Instagram webhook data structure
    return 'FEED'; // Default to FEED for regular mentions
  }
}