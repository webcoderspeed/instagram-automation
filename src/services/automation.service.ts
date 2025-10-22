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
  AutomationType, 
  TriggerType 
} from '../models/automation.model';
import logger from '../utils/logger';
import { ApiError } from '../utils/api-error';

interface ExecutionResult {
  success: boolean;
  executionTime: number;
  error?: string;
  data?: any;
}

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
   * Schedule an automation based on its triggers
   */
  async scheduleAutomation(automation: AutomationDocument): Promise<void> {
    try {
      const automationId = (automation._id as Types.ObjectId).toString();
      
      // Remove existing schedule if any
      this.unscheduleAutomation(automationId);

      for (const trigger of automation.config.triggers) {
        if (trigger.type === TriggerType.SCHEDULE && trigger.schedule?.cron) {
          const task = cron.schedule(
            trigger.schedule.cron,
            async () => {
              await this.executeAutomation(automationId);
            },
            {
              timezone: trigger.schedule.timezone || 'UTC'
            }
          );

          this.scheduledJobs.set(automationId, {
            automationId,
            task
          });

          logger.info(`Scheduled automation ${automation.name} with cron: ${trigger.schedule.cron}`);
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
   * Execute an automation
   */
  async executeAutomation(automationId: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    let automation: AutomationDocument | null = null;

    try {
      automation = await AutomationModel.findById(automationId)
        .populate('platformAccounts')
        .populate('userId');

      if (!automation) {
        throw new Error('Automation not found');
      }

      if (automation.status !== AutomationStatus.ACTIVE) {
        throw new Error('Automation is not active');
      }

      // Check execution limits
      await this.checkExecutionLimits(automation);

      // Execute based on automation type
      const result = await this.executeByType(automation);

      const executionTime = Date.now() - startTime;

      // Update analytics
      await automation.updateAnalytics(result.success, executionTime, result.error);

      // Update next execution time for scheduled automations
      await this.updateNextExecutionTime(automation);

      logger.info(`Automation ${automation.name} executed successfully in ${executionTime}ms`);

      return {
        success: result.success,
        executionTime,
        data: result.data,
        error: result.error
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (automation) {
        await automation.updateAnalytics(false, executionTime, errorMessage);
      }

      logger.error(`Automation execution failed: ${errorMessage}`);

      return {
        success: false,
        executionTime,
        error: errorMessage
      };
    }
  }

  /**
   * Execute automation based on its type
   */
  private async executeByType(automation: AutomationDocument): Promise<{ success: boolean; data?: any; error?: string }> {
    switch (automation.type) {
      case AutomationType.POST_SCHEDULING:
        return this.executePostScheduling(automation);
      
      case AutomationType.AUTO_REPLY:
        return this.executeAutoReply(automation);
      
      case AutomationType.CONTENT_CURATION:
        return this.executeContentCuration(automation);
      
      case AutomationType.ENGAGEMENT:
        return this.executeEngagement(automation);
      
      case AutomationType.ANALYTICS_REPORT:
        return this.executeAnalyticsReport(automation);
      
      case AutomationType.CROSS_POSTING:
        return this.executeCrossPosting(automation);
      
      default:
        throw new Error(`Unsupported automation type: ${automation.type}`);
    }
  }

  /**
   * Execute post scheduling automation
   */
  private async executePostScheduling(automation: AutomationDocument): Promise<{ success: boolean; data?: any }> {
    // Implementation for post scheduling
    // This would integrate with platform APIs to schedule posts
    
    const actions = automation.config.actions;
    const results = [];

    for (const action of actions) {
      if (action.type === 'schedule_post') {
        // Mock implementation - in real scenario, this would call platform APIs
        const result = {
          platform: action.platform,
          postId: new Types.ObjectId().toString(),
          scheduledAt: new Date(),
          status: 'scheduled'
        };
        results.push(result);
      }
    }

    return { success: true, data: { scheduledPosts: results } };
  }

  /**
   * Execute auto reply automation
   */
  private async executeAutoReply(automation: AutomationDocument): Promise<{ success: boolean; data?: any }> {
    // Implementation for auto reply
    // This would monitor for new comments/messages and send automated replies
    
    const replies = [];
    const actions = automation.config.actions;

    for (const action of actions) {
      if (action.type === 'send_reply') {
        // Mock implementation
        const reply = {
          messageId: new Types.ObjectId().toString(),
          replyText: action.config.message || 'Thank you for your message!',
          sentAt: new Date()
        };
        replies.push(reply);
      }
    }

    return { success: true, data: { replies } };
  }

  /**
   * Execute content curation automation
   */
  private async executeContentCuration(automation: AutomationDocument): Promise<{ success: boolean; data?: any }> {
    // Implementation for content curation
    // This would find and curate relevant content based on criteria
    
    const curatedContent = [];
    const actions = automation.config.actions;

    for (const action of actions) {
      if (action.type === 'curate_content') {
        // Mock implementation
        const content = {
          contentId: new Types.ObjectId().toString(),
          title: 'Curated Content',
          source: 'external_source',
          curatedAt: new Date()
        };
        curatedContent.push(content);
      }
    }

    return { success: true, data: { curatedContent } };
  }

  /**
   * Execute engagement automation
   */
  private async executeEngagement(automation: AutomationDocument): Promise<{ success: boolean; data?: any }> {
    // Implementation for engagement automation
    // This would like posts, follow users, etc.
    
    const engagements = [];
    const actions = automation.config.actions;

    for (const action of actions) {
      if (action.type === 'like_posts' || action.type === 'follow_users') {
        // Mock implementation
        const engagement = {
          actionType: action.type,
          targetId: new Types.ObjectId().toString(),
          platform: action.platform,
          executedAt: new Date()
        };
        engagements.push(engagement);
      }
    }

    return { success: true, data: { engagements } };
  }

  /**
   * Execute analytics report automation
   */
  private async executeAnalyticsReport(automation: AutomationDocument): Promise<{ success: boolean; data?: any }> {
    // Implementation for analytics report generation
    
    const actions = automation.config.actions;
    const reports = [];

    for (const action of actions) {
      if (action.type === 'generate_report') {
        // Generate analytics report
        const report = {
          reportId: new Types.ObjectId().toString(),
          type: 'weekly_analytics',
          generatedAt: new Date(),
          data: {
            totalPosts: 10,
            totalEngagement: 500,
            followerGrowth: 25
          }
        };
        reports.push(report);
      }
    }

    return { success: true, data: { reports } };
  }

  /**
   * Execute cross posting automation
   */
  private async executeCrossPosting(automation: AutomationDocument): Promise<{ success: boolean; data?: any }> {
    // Implementation for cross-platform posting
    
    const actions = automation.config.actions;
    const crossPosts = [];

    for (const action of actions) {
      if (action.type === 'cross_post') {
        // Mock implementation
        const crossPost = {
          originalPostId: action.config.sourcePostId,
          targetPlatform: action.platform,
          crossPostId: new Types.ObjectId().toString(),
          postedAt: new Date()
        };
        crossPosts.push(crossPost);
      }
    }

    return { success: true, data: { crossPosts } };
  }

  /**
   * Check execution limits for automation
   */
  private async checkExecutionLimits(automation: AutomationDocument): Promise<void> {
    const now = new Date();
    
    // Check max executions
    if (automation.maxExecutions && automation.executionCount >= automation.maxExecutions) {
      automation.status = AutomationStatus.COMPLETED;
      await automation.save();
      throw new Error('Maximum executions reached');
    }

    // Check daily limit
    if (automation.dailyLimit) {
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
            count: { $sum: '$executionCount' }
          }
        }
      ]);

      if (executions[0]?.count >= automation.dailyLimit) {
        throw new Error('Daily execution limit reached');
      }
    }

    // Check monthly limit
    if (automation.monthlyLimit) {
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
            count: { $sum: '$executionCount' }
          }
        }
      ]);

      if (executions[0]?.count >= automation.monthlyLimit) {
        throw new Error('Monthly execution limit reached');
      }
    }
  }

  /**
   * Update next execution time for scheduled automations
   */
  private async updateNextExecutionTime(automation: AutomationDocument): Promise<void> {
    for (const trigger of automation.config.triggers) {
      if (trigger.type === TriggerType.SCHEDULE && trigger.schedule?.cron) {
        // Calculate next execution time based on cron expression
        // This is a simplified implementation
        const nextExecution = new Date(Date.now() + 24 * 60 * 60 * 1000); // Next day
        automation.nextExecutionAt = nextExecution;
        await automation.save();
        break;
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

    automation.status = AutomationStatus.INACTIVE;
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
          inactive: {
            $sum: { $cond: [{ $eq: ['$status', AutomationStatus.INACTIVE] }, 1, 0] }
          },
          totalExecutions: { $sum: '$executionCount' },
          totalSuccesses: { $sum: '$successCount' },
          totalFailures: { $sum: '$failureCount' }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      active: 0,
      paused: 0,
      inactive: 0,
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