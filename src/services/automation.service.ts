/**
 * Automation Service
 * Handles automation execution, scheduling, and business logic
 */

import { Types } from 'mongoose';
import cron, { ScheduledTask } from 'node-cron';
import { 
  AutomationModel, 
  AutomationDocument, 
  AutomationStatus,
  TriggerType,
  ActionType
} from '../models/automation.model';
import { 
  AutomationExecutionResult, 
  StructuredAutomation,
  TriggerTypeType,
  ActionTypeType
} from '../types/automation.types';
import logger from '../utils/logger';
import { ApiError } from '../utils/api-error';

// Use the structured execution result type
type ExecutionResult = AutomationExecutionResult;

interface ScheduledJob {
  automationId: string;
  task: ScheduledTask;
}

export class AutomationService {
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private isInitialized = false;

  /**
   * Initialize the automation service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    logger.info('Initializing Automation Service...');
    
    // Load and schedule all active automations
    await this.loadActiveAutomations();
    
    // Start cleanup job for completed automations
    this.startCleanupJob();
    
    this.isInitialized = true;
    logger.info('Automation Service initialized successfully');
  }

  /**
   * Load and schedule all active automations
   */
  private async loadActiveAutomations(): Promise<void> {
    try {
      const activeAutomations = await AutomationModel.find({
        status: AutomationStatus.ACTIVE,
        deletedAt: null
      });

      for (const automation of activeAutomations) {
        await this.scheduleAutomation(automation);
      }

      logger.info(`Loaded ${activeAutomations.length} active automations`);
    } catch (error) {
      logger.error('Error loading active automations:', error);
    }
  }

  /**
   * Schedule an automation based on its trigger
   */
  async scheduleAutomation(automation: AutomationDocument): Promise<void> {
    try {
      const automationId = (automation._id as Types.ObjectId).toString();
      
      // Remove existing schedule if any
      this.unscheduleAutomation(automationId);

      // Check if automation has a schedule-based trigger
      if (automation.trigger.type === TriggerType.SCHEDULE_TIME_BASED || 
          automation.trigger.type === TriggerType.SCHEDULE_RECURRING) {
        
        const scheduleConfig = automation.trigger.config;
        if (scheduleConfig && 'cron' in scheduleConfig && scheduleConfig.cron) {
          const task = cron.schedule(
            scheduleConfig.cron,
            async () => {
              await this.executeAutomation(automationId);
            },
            {
              timezone: scheduleConfig.timezone || 'UTC'
            }
          );

          this.scheduledJobs.set(automationId, {
            automationId,
            task
          });

          logger.info(`Scheduled automation ${automation.name} with cron: ${scheduleConfig.cron}`);
        }
      }
    } catch (error) {
      logger.error(`Error scheduling automation ${(automation._id as Types.ObjectId).toString()}:`, error);
    }
  }

  /**
   * Unschedule an automation
   */
  unscheduleAutomation(automationId: string): void {
    const job = this.scheduledJobs.get(automationId);
    if (job) {
      job.task.stop();
      job.task.destroy();
      this.scheduledJobs.delete(automationId);
      logger.info(`Unscheduled automation ${automationId}`);
    }
  }

  /**
   * Execute a structured automation
   */
  async executeAutomation(automationId: string, testData?: Record<string, unknown>): Promise<ExecutionResult> {
    const startTime = Date.now();
    const executionId = new Types.ObjectId().toString();
    const triggeredAt = new Date();
    let automation: AutomationDocument | null = null;

    try {
      automation = await AutomationModel.findById(automationId)
        .populate('platformAccountId', 'platform username displayName')
        .populate('userId');

      if (!automation) {
        throw new Error('Automation not found');
      }

      if (automation.status !== AutomationStatus.ACTIVE && automation.status !== AutomationStatus.DRAFT) {
        throw new Error('Automation is not active or in draft mode');
      }

      // Check execution limits
      await this.checkExecutionLimits(automation);

      // Execute all actions in sequence
      const actionResults = await this.executeActions(automation, testData);

      const executionTime = Date.now() - startTime;
      const actionsExecuted = actionResults.length;
      const actionsSuccessful = actionResults.filter(r => r.success).length;
      const actionsFailed = actionsExecuted - actionsSuccessful;

      const result: AutomationExecutionResult = {
        executionId,
        automationId,
        success: actionsFailed === 0,
        executedAt: triggeredAt,
        executionTime,
        actionsExecuted,
        actionsSuccessful,
        actionsFailed,
        logs: actionResults.map(r => ({
          timestamp: new Date(),
          level: r.success ? 'info' : 'error',
          message: r.success ? `Action ${r.actionType} executed successfully` : `Action ${r.actionType} failed: ${r.error}`,
          data: r.data
        }))
      };

      if (actionsFailed > 0) {
        result.error = {
          message: `${actionsFailed} out of ${actionsExecuted} actions failed`,
          code: 'PARTIAL_EXECUTION_FAILURE',
          details: actionResults.filter(r => !r.success)
        };
      }

      // Update analytics using the automation model method
      await automation.updateAnalytics(result);

      // Update next execution time for scheduled automations
      await this.updateNextExecutionTime(automation);

      logger.info(`Automation ${automation.name} executed successfully in ${executionTime}ms`);

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const result: AutomationExecutionResult = {
        executionId,
        automationId,
        success: false,
        executedAt: triggeredAt,
        executionTime,
        actionsExecuted: 0,
        actionsSuccessful: 0,
        actionsFailed: 0,
        error: {
          message: errorMessage,
          code: 'EXECUTION_ERROR',
          details: error
        },
        logs: [{
          timestamp: new Date(),
          level: 'error',
          message: `Automation execution failed: ${errorMessage}`,
          data: { error }
        }]
      };

      if (automation) {
        await automation.updateAnalytics(result);
      }

      logger.error(`Automation execution failed: ${errorMessage}`);

      return result;
    }
  }

  /**
   * Execute all actions in an automation
   */
  private async executeActions(automation: AutomationDocument, testData?: Record<string, unknown>): Promise<Array<{
    actionType: string;
    success: boolean;
    data?: any;
    error?: string;
  }>> {
    const results = [];

    for (const action of automation.actions) {
      try {
        const result = await this.executeAction(action, automation, testData);
        results.push({
          actionType: action.type,
          success: true,
          data: result
        });
      } catch (error) {
        results.push({
          actionType: action.type,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: any, automation: AutomationDocument, testData?: Record<string, unknown>): Promise<any> {
    switch (action.type) {
      case ActionType.INSTAGRAM_SEND_MESSAGE:
        return this.executeInstagramSendMessage(action, automation, testData);
      
      case ActionType.INSTAGRAM_REPLY_TO_COMMENT:
        return this.executeInstagramReplyToComment(action, automation, testData);
      
      case ActionType.INSTAGRAM_LIKE_COMMENT:
        return this.executeInstagramLikeComment(action, automation, testData);
      
      case ActionType.INSTAGRAM_HIDE_COMMENT:
        return this.executeInstagramHideComment(action, automation, testData);
      
      case ActionType.INSTAGRAM_PUBLISH_POST:
        return this.executeInstagramPublishPost(action, automation, testData);
      
      case ActionType.SAVE_TO_CRM:
        return this.executeSaveToCrm(action, automation, testData);
      
      case ActionType.SEND_NOTIFICATION:
        return this.executeSendNotification(action, automation, testData);
      
      case ActionType.WEBHOOK_CALL:
        return this.executeWebhookCall(action, automation, testData);
      
      case ActionType.TRACK_ENGAGEMENT:
        return this.executeTrackEngagement(action, automation, testData);
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Execute Instagram send message action
   */
  private async executeInstagramSendMessage(action: any, automation: AutomationDocument, testData?: Record<string, unknown>): Promise<any> {
    // Implementation for sending Instagram messages
    const message = action.config?.message || 'Hello!';
    const recipient = action.config?.recipient || testData?.recipient;
    
    // Mock implementation - in real scenario, this would call Instagram API
    return {
      messageId: new Types.ObjectId().toString(),
      recipient,
      message,
      sentAt: new Date(),
      platform: 'instagram'
    };
  }

  /**
   * Execute Instagram reply to comment action
   */
  private async executeInstagramReplyToComment(action: any, automation: AutomationDocument, testData?: Record<string, unknown>): Promise<any> {
    const replyText = action.config?.replyText || 'Thank you for your comment!';
    const commentId = action.config?.commentId || testData?.commentId;
    
    return {
      replyId: new Types.ObjectId().toString(),
      commentId,
      replyText,
      repliedAt: new Date(),
      platform: 'instagram'
    };
  }

  /**
   * Execute Instagram like comment action
   */
  private async executeInstagramLikeComment(action: any, automation: AutomationDocument, testData?: Record<string, unknown>): Promise<any> {
    const commentId = action.config?.commentId || testData?.commentId;
    
    return {
      commentId,
      liked: true,
      likedAt: new Date(),
      platform: 'instagram'
    };
  }

  /**
   * Execute Instagram hide comment action
   */
  private async executeInstagramHideComment(action: any, automation: AutomationDocument, testData?: Record<string, unknown>): Promise<any> {
    const commentId = action.config?.commentId || testData?.commentId;
    
    return {
      commentId,
      hidden: true,
      hiddenAt: new Date(),
      platform: 'instagram'
    };
  }

  /**
   * Execute Instagram publish post action
   */
  private async executeInstagramPublishPost(action: any, automation: AutomationDocument, testData?: Record<string, unknown>): Promise<any> {
    const content = action.config?.content || testData?.content;
    const mediaUrls = action.config?.mediaUrls || testData?.mediaUrls || [];
    
    return {
      postId: new Types.ObjectId().toString(),
      content,
      mediaUrls,
      publishedAt: new Date(),
      platform: 'instagram'
    };
  }

  /**
   * Execute save to CRM action
   */
  private async executeSaveToCrm(action: any, automation: AutomationDocument, testData?: Record<string, unknown>): Promise<any> {
    const data = action.config?.data || testData;
    
    return {
      crmRecordId: new Types.ObjectId().toString(),
      data,
      savedAt: new Date()
    };
  }

  /**
   * Execute send notification action
   */
  private async executeSendNotification(action: any, automation: AutomationDocument, testData?: Record<string, unknown>): Promise<any> {
    const message = action.config?.message || 'Automation notification';
    const type = action.config?.type || 'info';
    
    return {
      notificationId: new Types.ObjectId().toString(),
      message,
      type,
      sentAt: new Date()
    };
  }

  /**
   * Execute webhook call action
   */
  private async executeWebhookCall(action: any, automation: AutomationDocument, testData?: Record<string, unknown>): Promise<any> {
    const url = action.config?.url;
    const method = action.config?.method || 'POST';
    const payload = action.config?.payload || testData;
    
    // Mock implementation - in real scenario, this would make HTTP request
    return {
      webhookId: new Types.ObjectId().toString(),
      url,
      method,
      payload,
      calledAt: new Date(),
      status: 'success'
    };
  }

  /**
   * Execute track engagement action
   */
  private async executeTrackEngagement(action: any, automation: AutomationDocument, testData?: Record<string, unknown>): Promise<any> {
    const engagementType = action.config?.engagementType || 'like';
    const targetId = action.config?.targetId || testData?.targetId;
    
    return {
      engagementId: new Types.ObjectId().toString(),
      engagementType,
      targetId,
      trackedAt: new Date()
    };
  }

  /**
   * Check execution limits for automation
   */
  private async checkExecutionLimits(automation: AutomationDocument): Promise<void> {
    const now = new Date();
    const limits = automation.limits;
    const stats = automation.executionStats;
    
    // Check max executions
    if (limits?.maxExecutions && stats?.totalExecutions >= limits.maxExecutions) {
      automation.status = AutomationStatus.COMPLETED;
      await automation.save();
      throw new Error('Maximum executions reached');
    }

    // Check daily limit
    if (limits?.dailyLimit) {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const executions = await AutomationModel.aggregate([
        {
          $match: {
            _id: automation._id,
            lastExecutedAt: { $gte: startOfDay }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: '$executionStats.totalExecutions' }
          }
        }
      ]);

      if (executions[0]?.count >= limits.dailyLimit) {
        throw new Error('Daily execution limit reached');
      }
    }

    // Check monthly limit
    if (limits?.monthlyLimit) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const executions = await AutomationModel.aggregate([
        {
          $match: {
            _id: automation._id,
            lastExecutedAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: '$executionStats.totalExecutions' }
          }
        }
      ]);

      if (executions[0]?.count >= limits.monthlyLimit) {
        throw new Error('Monthly execution limit reached');
      }
    }
  }

  /**
   * Update next execution time for scheduled automations
   */
  private async updateNextExecutionTime(automation: AutomationDocument): Promise<void> {
    const trigger = automation.trigger;
    if (trigger?.type === TriggerType.SCHEDULE_RECURRING) {
      if ('cron' in trigger.config && trigger.config.cron) {
        // Calculate next execution time based on cron expression
        // This is a simplified implementation
        const nextExecution = new Date(Date.now() + 24 * 60 * 60 * 1000); // Next day
        automation.updatedAt = new Date();
        await automation.save();
      }
    }
  }

  /**
   * Start automation
   */
  async startAutomation(automationId: string): Promise<AutomationDocument> {
    const automation = await AutomationModel.findById(automationId);
    
    if (!automation) {
      throw new ApiError(404, 'Automation not found');
    }

    automation.status = AutomationStatus.ACTIVE;
    await automation.save();

    // Schedule the automation
    await this.scheduleAutomation(automation);

    return automation;
  }

  /**
   * Pause automation
   */
  async pauseAutomation(automationId: string): Promise<AutomationDocument> {
    const automation = await AutomationModel.findById(automationId);
    
    if (!automation) {
      throw new ApiError(404, 'Automation not found');
    }

    automation.status = AutomationStatus.PAUSED;
    await automation.save();

    // Unschedule the automation
    this.unscheduleAutomation(automationId);

    return automation;
  }

  /**
   * Stop automation
   */
  async stopAutomation(automationId: string): Promise<AutomationDocument> {
    const automation = await AutomationModel.findById(automationId);
    
    if (!automation) {
      throw new ApiError(404, 'Automation not found');
    }

    automation.status = AutomationStatus.STOPPED;
    await automation.save();

    // Unschedule the automation
    this.unscheduleAutomation(automationId);

    return automation;
  }

  /**
   * Get automation statistics
   */
  async getAutomationStats(userId: Types.ObjectId): Promise<any> {
    const stats = await AutomationModel.aggregate([
      {
        $match: {
          userId,
          deletedAt: null
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', AutomationStatus.ACTIVE] }, 1, 0] }
          },
          paused: {
            $sum: { $cond: [{ $eq: ['$status', AutomationStatus.PAUSED] }, 1, 0] }
          },
          stopped: {
            $sum: { $cond: [{ $eq: ['$status', AutomationStatus.STOPPED] }, 1, 0] }
          },
          totalExecutions: { $sum: '$executionStats.totalExecutions' },
          totalSuccesses: { $sum: '$executionStats.successfulExecutions' },
          totalFailures: { $sum: '$executionStats.failedExecutions' }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      active: 0,
      paused: 0,
      stopped: 0,
      totalExecutions: 0,
      totalSuccesses: 0,
      totalFailures: 0
    };

    result.successRate = result.totalExecutions > 0 
      ? (result.totalSuccesses / result.totalExecutions) * 100 
      : 0;

    return result;
  }

  /**
   * Start cleanup job for completed automations
   */
  private startCleanupJob(): void {
    // Run cleanup every day at midnight
    cron.schedule('0 0 * * *', async () => {
      try {
        await this.cleanupCompletedAutomations();
      } catch (error) {
        logger.error('Error in automation cleanup job:', error);
      }
    });
  }

  /**
   * Cleanup completed automations
   */
  private async cleanupCompletedAutomations(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const result = await AutomationModel.updateMany(
      {
        status: AutomationStatus.COMPLETED,
        updatedAt: { $lt: thirtyDaysAgo },
        deletedAt: null
      },
      {
        deletedAt: new Date()
      }
    );

    logger.info(`Cleaned up ${result.modifiedCount} completed automations`);
  }

  /**
   * Shutdown the automation service
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Automation Service...');
    
    // Stop all scheduled jobs
    for (const [automationId, job] of this.scheduledJobs) {
      job.task.stop();
      job.task.destroy();
    }
    
    this.scheduledJobs.clear();
    this.isInitialized = false;
    
    logger.info('Automation Service shut down successfully');
  }
}

// Export singleton instance
export const automationService = new AutomationService();