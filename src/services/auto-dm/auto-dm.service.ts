/**
 * Auto DM Service
 * Handles automatic direct message responses based on automation rules
 * Processes incoming messages and triggers appropriate automated responses
 */

import logger from "../../utils/logger";
import {
  AutomationModel,
  AutomationDocument,
} from "../../models/automation.model";
import { PlatformAccountModel } from "../../models/platform-account.model";
import { messagingService } from "../messaging";
import { Types } from "mongoose";

export interface MessageMetadata {
  type?: "message" | "comment" | "mention";
  mediaId?: string;
  mediaType?: string;
  parentCommentId?: string;
  username?: string;
}

export interface IncomingMessage {
  senderId: string;
  recipientId: string;
  text: string;
  messageId: string;
  platform: "instagram" | "facebook" | "twitter";
  timestamp: Date;
  entryId: string;
  metadata?: MessageMetadata;
}

export interface AutomationAction {
  type: string;
  config: {
    message?: string;
    text?: string;
    replyText?: string;
  };
}

export interface AutomationTriggerConfig {
  keywords?: string[];
  exactMatch?: boolean;
  caseSensitive?: boolean;
  excludeKeywords?: string[];
}

export interface AutoDMMatch {
  automation: AutomationDocument;
  confidence: number;
  matchedKeywords: string[];
  triggerType: "keyword" | "condition" | "default";
}

export interface AutoDMResponse {
  success: boolean;
  message?: string;
  error?: string;
  automationId?: string;
  responseText?: string;
}

export interface PlatformAccountWithToken {
  _id: unknown;
  id: string;
  accessToken: string;
  platform: string;
}

export class AutoDMService {
  private isInitialized = false;

  constructor() {
    this.isInitialized = true;
    logger.info("Auto DM service initialized");
  }

  /**
   * Determine trigger types based on message metadata
   */
  private determineTriggerTypes(messageType?: string): string[] {
    if (messageType === "comment") {
      return ["instagram.comment_received"];
    }

    if (messageType === "mention") {
      return ["instagram.comment_received"]; // Mentions are also handled as comments
    }

    return ["instagram.message_received"]; // Legacy format for messages
  }

  /**
   * Find appropriate reply action based on message type
   */
  private findReplyAction(
    actions: AutomationAction[],
    messageType?: string
  ): AutomationAction | undefined {
    if (messageType === "comment" || messageType === "mention") {
      return actions.find(
        (action) =>
          action.type === "instagram.reply_to_comment" ||
          action.type === "INSTAGRAM_REPLY_TO_COMMENT"
      );
    }

    return actions.find(
      (action) =>
        action.type === "instagram.send_message" ||
        action.type === "send_message"
    );
  }

  /**
   * Extract reply text from action config
   */
  private extractReplyText(action: AutomationAction): string {
    return (
      action.config?.message ||
      action.config?.text ||
      action.config?.replyText ||
      "Thank you for your message!"
    );
  }

  /**
   * Create evaluation result for automation matching
   */
  private createEvaluationResult(
    automation: AutomationDocument,
    confidence: number,
    matchedKeywords: string[],
    triggerType: "keyword" | "condition" | "default"
  ): AutoDMMatch {
    return {
      automation,
      confidence,
      matchedKeywords,
      triggerType,
    };
  }

  /**
   * Process incoming message and trigger auto DM if matching automation found
   */
  async processIncomingMessage(
    message: IncomingMessage
  ): Promise<AutoDMResponse> {
    try {
      if (!this.isInitialized) {
        throw new Error("Auto DM service not initialized");
      }

      logger.info("Processing incoming message for auto DM", {
        senderId: message.senderId,
        recipientId: message.recipientId,
        messageId: message.messageId,
        platform: message.platform,
        hasText: !!message.text,
      });

      // Find platform account for the recipient
      const platformAccount = await this.findPlatformAccount(
        message.recipientId,
        message.platform
      );
      if (!platformAccount) {
        logger.debug("No platform account found for recipient", {
          recipientId: message.recipientId,
          platform: message.platform,
        });
        return { success: false, error: "Platform account not found" };
      }

      // Find matching automations
      const matches = await this.findMatchingAutomations(
        message,
        platformAccount.userId
      );
      if (matches.length === 0) {
        logger.debug("No matching automations found", {
          senderId: message.senderId,
          recipientId: message.recipientId,
          text: message.text,
        });
        return { success: false, message: "No matching automations found" };
      }

      // Select best match (highest confidence)
      const bestMatch = matches.sort((a, b) => b.confidence - a.confidence)[0];

      logger.info("Found matching automation for auto DM", {
        automationId: bestMatch.automation._id,
        automationName: bestMatch.automation.name,
        confidence: bestMatch.confidence,
        matchedKeywords: bestMatch.matchedKeywords,
        triggerType: bestMatch.triggerType,
      });

      // Execute auto DM response
      const response = await this.executeAutoDM(message, bestMatch);

      // Update automation analytics
      await this.updateAutomationAnalytics(
        bestMatch.automation,
        response.success
      );

      return response;
    } catch (error) {
      logger.error("Error processing incoming message for auto DM", {
        error: error instanceof Error ? error.message : "Unknown error",
        senderId: message.senderId,
        messageId: message.messageId,
      });

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
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
        isActive: true,
      })

      return platformAccount;
    } catch (error) {
      logger.error("Error finding platform account", {
        error: error instanceof Error ? error.message : "Unknown error",
        recipientId,
        platform,
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
      // Determine trigger type based on message metadata
      const triggerTypes = this.determineTriggerTypes(message.metadata?.type);

      console.log({
        userId: userId,
        "trigger.type": { $in: triggerTypes },
        status: "active",
        deletedAt: null,
      });

      // Find active auto-reply automations for the user
      const automations = await AutomationModel.find({
        userId: userId,
        "trigger.type": { $in: triggerTypes },
        status: "active",
        deletedAt: null,
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
      logger.error("Error finding matching automations", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
        messageText: message.text,
      });
      return [];
    }
  }

  /**
   * Check keywords match in automation trigger
   */
  private checkKeywordMatch(
    messageText: string,
    automation: AutomationDocument
  ): { matchedKeywords: string[]; confidence: number } {
    const matchedKeywords: string[] = [];
    const baseConfidence = 0.8; // High confidence for exact keyword match

    if (
      (automation.trigger.type === "instagram.message_received" ||
        automation.trigger.type === "instagram.comment_received") &&
      "keywords" in automation.trigger.config &&
      automation.trigger.config.keywords
    ) {
      const keywords = Array.isArray(automation.trigger.config.keywords)
        ? automation.trigger.config.keywords
        : [automation.trigger.config.keywords];

      for (const keyword of keywords) {
        const keywordLower = keyword.toString().toLowerCase();
        if (messageText.includes(keywordLower)) {
          matchedKeywords.push(keyword.toString());
        }
      }
    }

    return {
      matchedKeywords,
      confidence: matchedKeywords.length * baseConfidence,
    };
  }

  /**
   * Check conditions match in automation
   */
  private checkConditionsMatch(
    messageText: string,
    automation: AutomationDocument
  ): { matchedKeywords: string[]; confidence: number } {
    const matchedKeywords: string[] = [];
    const baseConfidence = 0.5;

    if (automation.conditions) {
      for (const condition of automation.conditions) {
        if (
          condition.field === "message_text" &&
          condition.operator === "contains"
        ) {
          const value = condition.value?.toString().toLowerCase();
          if (value && messageText.includes(value)) {
            matchedKeywords.push(value);
          }
        }
      }
    }

    return {
      matchedKeywords,
      confidence: matchedKeywords.length * baseConfidence,
    };
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

      // For Instagram comment triggers, check media ID matching first
      if (
        automation.trigger.type === "instagram.comment_received" &&
        message.metadata?.type === "comment"
      ) {
        const triggerConfig = automation.trigger.config as any;

        // Check if automation is configured for specific media IDs
        if (
          triggerConfig.mediaIds &&
          Array.isArray(triggerConfig.mediaIds) &&
          triggerConfig.mediaIds.length > 0
        ) {
          const messageMediaId = message.metadata?.mediaId;

          if (!messageMediaId) {
            logger.debug(
              "Comment message missing mediaId, skipping automation",
              {
                automationId: automation._id,
                messageId: message.messageId,
              }
            );
            return null;
          }

          // Check if the comment's media ID matches any of the configured media IDs
          const mediaIdMatch = triggerConfig.mediaIds.includes(messageMediaId);
          if (!mediaIdMatch) {
            logger.debug(
              "Comment media ID does not match automation configuration",
              {
                automationId: automation._id,
                messageMediaId,
                configuredMediaIds: triggerConfig.mediaIds,
              }
            );
            return null;
          }

          logger.debug("Media ID match found for comment automation", {
            automationId: automation._id,
            messageMediaId,
            configuredMediaIds: triggerConfig.mediaIds,
          });
        }

        // Check exclude keywords first
        if (
          triggerConfig.excludeKeywords &&
          Array.isArray(triggerConfig.excludeKeywords)
        ) {
          const hasExcludedKeyword = triggerConfig.excludeKeywords.some(
            (keyword: string) => messageText.includes(keyword.toLowerCase())
          );
          if (hasExcludedKeyword) {
            logger.debug(
              "Comment contains excluded keyword, skipping automation",
              {
                automationId: automation._id,
                messageText: message.text,
                excludeKeywords: triggerConfig.excludeKeywords,
              }
            );
            return null;
          }
        }
      }

      // Check keyword matches
      const keywordResult = this.checkKeywordMatch(messageText, automation);

      // Check condition matches
      const conditionResult = this.checkConditionsMatch(
        messageText,
        automation
      );

      // Combine results
      const allMatchedKeywords = [
        ...keywordResult.matchedKeywords,
        ...conditionResult.matchedKeywords,
      ];
      const totalConfidence =
        keywordResult.confidence + conditionResult.confidence;

      // Determine trigger type
      const triggerType: "keyword" | "condition" | "default" =
        keywordResult.matchedKeywords.length > 0
          ? "keyword"
          : conditionResult.matchedKeywords.length > 0
          ? "condition"
          : "default";

      // Return match if confidence is above threshold
      if (totalConfidence > 0.2) {
        return this.createEvaluationResult(
          automation,
          totalConfidence,
          allMatchedKeywords,
          triggerType
        );
      }

      return null;
    } catch (error) {
      logger.error("Error evaluating automation match", {
        error: error instanceof Error ? error.message : "Unknown error",
        automationId: automation._id,
        messageText: message.text,
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

      // Find the reply action in automation config based on message type
      const replyAction = this.findReplyAction(
        automation.actions as AutomationAction[],
        message.metadata?.type
      );

      if (!replyAction) {
        logger.warn("No reply action found in automation", {
          automationId: automation._id,
        });
        return { success: false, error: "No reply action configured" };
      }

      // Get reply text from action config
      const baseReplyText = this.extractReplyText(replyAction);

      // Replace variables in reply text
      const replyText = await this.replaceVariables(
        baseReplyText,
        message,
        match
      );

      // Send the reply message
      const sendResult = await this.sendReplyMessage(message, replyText);

      if (sendResult.success) {
        logger.info("Auto DM sent successfully", {
          automationId: automation._id,
          senderId: message.senderId,
          replyText: replyText.substring(0, 100) + "...",
        });

        return {
          success: true,
          message: "Auto DM sent successfully",
          automationId: String(automation._id),
          responseText: replyText,
        };
      } else {
        return {
          success: false,
          error: sendResult.error || "Failed to send reply message",
        };
      }
    } catch (error) {
      logger.error("Error executing auto DM", {
        error: error instanceof Error ? error.message : "Unknown error",
        automationId: match.automation._id,
        senderId: message.senderId,
      });

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Apply variable replacements to text
   */
  private applyVariableReplacements(
    text: string,
    replacements: Record<string, string>
  ): string {
    return Object.entries(replacements).reduce(
      (result, [pattern, value]) =>
        result.replace(new RegExp(pattern, "g"), value),
      text
    );
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
      const now = new Date();

      const replacements: Record<string, string> = {
        "\\{sender_id\\}": message.senderId,
        "\\{message_text\\}": message.text,
        "\\{matched_keywords\\}": match.matchedKeywords.join(", "),
        "\\{timestamp\\}": message.timestamp.toISOString(),
        "\\{platform\\}": message.platform,
        "\\{current_time\\}": now.toLocaleTimeString(),
        "\\{current_date\\}": now.toLocaleDateString(),
      };

      return this.applyVariableReplacements(text, replacements);
    } catch (error) {
      logger.error("Error replacing variables in reply text", {
        error: error instanceof Error ? error.message : "Unknown error",
        originalText: text,
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
      const platformAccount = await this.findPlatformAccount(
        message.recipientId,
        message.platform
      );
      if (!platformAccount) {
        logger.error("Platform account not found for sending reply", {
          recipientId: message.recipientId,
          platform: message.platform,
        });
        return {
          success: false,
          error: "Platform account not found",
        };
      }

      // Get access token (need to explicitly select it since it's excluded by default)
      const accountWithToken = await PlatformAccountModel.findById(
        platformAccount._id
      )
        .select("+accessToken")
        .exec();

      if (!accountWithToken || !accountWithToken.accessToken) {
        logger.error("Access token not found for platform account", {
          accountId: platformAccount._id,
          platform: message.platform,
        });
        return {
          success: false,
          error: "Access token not found",
        };
      }

      // Use the messaging service to send the reply
      const isCommentOrMention =
        message.metadata?.type === "comment" ||
        message.metadata?.type === "mention";

      if (isCommentOrMention) {
        return this.sendPrivateReply(message, replyText, accountWithToken);
      } else {
        return this.sendDirectMessage(message, replyText, accountWithToken);
      }
    } catch (error) {
      logger.error("Error sending reply message", {
        error: error instanceof Error ? error.message : "Unknown error",
        senderId: message.senderId,
        platform: message.platform,
      });

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Send private reply for comments and mentions
   */
  private async sendPrivateReply(
    message: IncomingMessage,
    replyText: string,
    accountWithToken: PlatformAccountWithToken
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await messagingService.sendPrivateReply({
        commentId: message.messageId, // Comment ID
        message: replyText,
        accessToken: accountWithToken.accessToken,
        instagramUserId: accountWithToken.id,
      });

      return {
        success: !!result,
        error: result ? undefined : "Failed to send private reply",
      };
    } catch (error) {
      logger.error("Error sending private reply", {
        error: error instanceof Error ? error.message : "Unknown error",
        messageId: message.messageId,
      });

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Send direct message
   */
  private async sendDirectMessage(
    message: IncomingMessage,
    replyText: string,
    accountWithToken: PlatformAccountWithToken
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await messagingService.sendTextMessage(
        message.senderId,
        replyText,
        message.platform,
        accountWithToken.accessToken,
        accountWithToken.id // Instagram user ID
      );

      return { success: result.success, error: result.error };
    } catch (error) {
      logger.error("Error sending direct message", {
        error: error instanceof Error ? error.message : "Unknown error",
        senderId: message.senderId,
      });

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
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
        executionId: `exec_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        automationId: (automation._id as any).toString(),
        success,
        executedAt: new Date(),
        executionTime: 0, // 0 execution time for now
        actionsExecuted: 1,
        actionsSuccessful: success ? 1 : 0,
        actionsFailed: success ? 0 : 1,
        logs: [
          {
            timestamp: new Date(),
            level: (success ? "info" : "error") as "info" | "error" | "warn",
            message: success
              ? "Auto-DM sent successfully"
              : "Auto-DM failed to send",
          },
        ],
      };

      await automation.updateAnalytics(executionResult);

      logger.debug("Updated automation analytics", {
        automationId: automation._id,
        success,
        executionCount: automation.executionStats.totalExecutions,
        successCount: automation.executionStats.successfulExecutions,
        failureCount: automation.executionStats.failedExecutions,
      });
    } catch (error) {
      logger.error("Error updating automation analytics", {
        error: error instanceof Error ? error.message : "Unknown error",
        automationId: automation._id,
      });
    }
  }

  /**
   * Get service status
   */
  getStatus(): { initialized: boolean; activeAutomations?: number } {
    return {
      initialized: this.isInitialized,
    };
  }
}

// Export singleton instance
export const autoDMService = new AutoDMService();
