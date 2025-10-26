import { CommentAutomationHandler } from './comment-handler';
import { MessageAutomationHandler } from './message-handler';
import { MentionAutomationHandler } from './mention-handler';
import { BaseAutomationHandler } from './base-handler';
import {
  IncomingWebhookMessage,
  AutomationHandlerContext,
  AutomationMatch
} from './types';
import { AutomationDocument } from '../../../models/automation.model';
import { PlatformAccountDocument } from '../../../models/platform-account.model';
import { InstagramMessagingService } from '../../../services/messaging';
import { Types } from 'mongoose';

export class AutomationDispatcher {
  private handlers: BaseAutomationHandler[];

  constructor() {
    this.handlers = [
      new CommentAutomationHandler(),
      new MessageAutomationHandler(),
      new MentionAutomationHandler()
    ];
  }

  /**
   * Process an incoming webhook message and execute matching automations
   */
  async processWebhookMessage(
    message: IncomingWebhookMessage,
    platformAccount: PlatformAccountDocument,
    userId: Types.ObjectId,
    webhookSource: string = 'instagram',
    requestId: string = `req_${Date.now()}`
  ): Promise<void> {
    try {
      console.log(`Processing webhook message of type: ${message.metadata?.type}`);

      // Create context for automation execution
      const context: AutomationHandlerContext = {
        userId,
        platformAccountId: platformAccount._id as Types.ObjectId,
        webhookSource,
        requestId
      };

      // Find handlers that can process this message
      const applicableHandlers = this.handlers.filter(handler => 
        handler.canHandle(message)
      );

      if (applicableHandlers.length === 0) {
        console.log(`No handlers found for message type: ${message.metadata?.type}`);
        return;
      }

      console.log(`Found ${applicableHandlers.length} applicable handler(s)`);

      // Process message with each applicable handler
      for (const handler of applicableHandlers) {
        try {
          await this.processWithHandler(handler, message, context);
        } catch (error) {
          console.error(`Error processing with handler ${handler.constructor.name}:`, error);
          // Continue with other handlers even if one fails
        }
      }

    } catch (error) {
      console.error('Error in automation dispatcher:', error);
      throw error;
    }
  }

  /**
   * Process message with a specific handler
   */
  private async processWithHandler(
    handler: BaseAutomationHandler,
    message: IncomingWebhookMessage,
    context: AutomationHandlerContext
  ): Promise<void> {
    try {
      // Use the base handler's findMatchingAutomations method which handles everything internally
      const matches = await handler.findMatchingAutomations(message, context);
      
      if (matches.length === 0) {
        console.log(`No automation matches found for handler ${handler.constructor.name}`);
        return;
      }

      console.log(`Found ${matches.length} automation match(es) with ${handler.constructor.name}`);

      // Sort matches by confidence (highest first) - though base handler already does this
      matches.sort((a, b) => b.confidence - a.confidence);

      // Execute the highest confidence match
      const bestMatch = matches[0];
      try {
        await handler.executeAutomation(message, bestMatch, context);
        console.log(`Successfully executed automation ${bestMatch.automation._id} with confidence ${bestMatch.confidence}`);
      } catch (error) {
        console.error(`Error executing automation ${bestMatch.automation._id}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`Error in processWithHandler for ${handler.constructor.name}:`, error);
      throw error;
    }
  }

  /**
   * Get statistics about available handlers
   */
  getHandlerStats(): { handlerName: string; triggerType: string }[] {
    return this.handlers.map(handler => ({
      handlerName: handler.constructor.name,
      triggerType: handler.triggerType
    }));
  }

  /**
   * Add a custom handler to the dispatcher
   */
  addHandler(handler: BaseAutomationHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Remove a handler from the dispatcher
   */
  removeHandler(handlerClass: new (...args: any[]) => BaseAutomationHandler): void {
    this.handlers = this.handlers.filter(handler => 
      !(handler instanceof handlerClass)
    );
  }
}