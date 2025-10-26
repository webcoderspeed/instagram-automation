import { Request, Response, NextFunction } from 'express';
import { Types, FilterQuery, SortOrder } from 'mongoose';
import asyncHandler from 'express-async-handler';
import { ApiError } from '../utils/api-error';
import { AutomationModel, AutomationStatus, TriggerType, ActionType, AutomationDocument } from '../models/automation.model';
import { PlatformAccountModel } from '../models/platform-account.model';
import { automationService } from '../services/automation.service';
import { sendSuccess, createMeta } from '../utils/response-builder';
import { PlatformAccountEncryption } from '../utils/platform-account-encryption';
import { 
  createAutomationSchema, 
  updateAutomationSchema,
  executeAutomationSchema 
} from '../validators/automation.validator';
import { 
  StructuredAutomation, 
  AutomationExecutionResult, 
  AutomationTrigger,
  ScheduleTimeTrigger,
  ScheduleRecurringTrigger 
} from '../types/automation.types';
import { SessionUser } from '../config/session.config';

export class AutomationController {
  /**
   * Transform trigger with date conversion for schedule-based triggers
   */
  private transformTriggerWithDates(trigger: AutomationTrigger): AutomationTrigger {
    if (trigger.type === 'schedule.time_based') {
      return {
        ...trigger,
        config: {
          ...trigger.config,
          executeAt: new Date(trigger.config.executeAt)
        }
      } as ScheduleTimeTrigger;
    }
    
    if (trigger.type === 'schedule.recurring') {
      return {
        ...trigger,
        config: {
          ...trigger.config,
          startDate: trigger.config.startDate ? new Date(trigger.config.startDate) : undefined,
          endDate: trigger.config.endDate ? new Date(trigger.config.endDate) : undefined
        }
      } as ScheduleRecurringTrigger;
    }
    
    return trigger;
  }

  /**
   * Parse test data from request body
   */
  private parseTestData(requestBody: unknown): Record<string, unknown> | undefined {
    if (!requestBody || typeof requestBody !== 'object' || Object.keys(requestBody).length === 0) {
      return undefined;
    }
    
    const validatedData = executeAutomationSchema.parse(requestBody);
    return validatedData.testData;
  }

  /**
   * Get authenticated user from request
   */
  private getAuthenticatedUser(req: Request): SessionUser {
    if (!req.session.user) {
      throw ApiError.unauthorized("User not authenticated");
    }
    return req.session.user;
  }

  /**
   * Get all automations for authenticated user
   */
  getAutomations = asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getAuthenticatedUser(req).id;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      platform,
      triggerType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: FilterQuery<AutomationDocument> = {
      userId,
      deletedAt: null
    };

    if (status) {
      query.status = status;
    }

    if (platform) {
      query.platform = platform;
    }

    if (triggerType) {
      query['trigger.type'] = triggerType;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }

    // Build sort
    const sort: Record<string, SortOrder> = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const [automations, total] = await Promise.all([
      AutomationModel.find(query)
        .populate('platformAccountIds', 'platform username displayName')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AutomationModel.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    sendSuccess(res, {
      automations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Get single automation by ID
   */
  getAutomation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getAuthenticatedUser(req).id;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid automation ID');
    }

    const automation = await AutomationModel.findOne({
      _id: id,
      userId,
      deletedAt: null
    }).populate('platformAccountIds', 'platform username displayName').lean();

    if (!automation) {
      throw new ApiError(404, 'Automation not found');
    }

    sendSuccess(res, { automation }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Create new structured automation
   */
  createAutomation = asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getAuthenticatedUser(req).id;
    
    // Get validated data from middleware
    const validatedData = req.validatedData.body;

    // Validate platform accounts belong to user
    const platformAccountIds = Array.isArray(validatedData.platformAccountIds) 
      ? validatedData.platformAccountIds 
      : [validatedData.platformAccountIds[0]];
    
    const platformAccounts = await PlatformAccountModel.find({
      _id: { $in: platformAccountIds },
      userId,
      isActive: true
    });

    if (platformAccounts.length !== platformAccountIds.length) {
      throw new ApiError(400, 'One or more platform accounts not found or not accessible');
    }

    // Ensure platform matches the accounts
    const invalidAccounts = platformAccounts.filter(account => account.platform !== validatedData.platform);
    if (invalidAccounts.length > 0) {
      throw new ApiError(400, 'Platform mismatch with selected accounts');
    }

    const automation = new AutomationModel({
      userId,
      name: validatedData.name,
      description: validatedData.description,
      platform: validatedData.platform,
      platformAccountIds: platformAccountIds.map((id: string) => new Types.ObjectId(id)),
      trigger: validatedData.trigger,
      actions: validatedData.actions,
      conditions: validatedData.conditions || [],
      settings: {
        stopOnError: validatedData.settings?.stopOnError ?? false,
        maxRetries: validatedData.settings?.maxRetries ?? 3,
        retryDelay: validatedData.settings?.retryDelay ?? 60,
        notifyOnSuccess: validatedData.settings?.notifyOnSuccess ?? false,
        notifyOnError: validatedData.settings?.notifyOnError ?? true,
        priority: validatedData.settings?.priority || 'normal',
        timeout: validatedData.settings?.timeout || 30,
        variables: validatedData.settings?.variables || {}
      },
      tags: validatedData.tags || [],
      status: AutomationStatus.DRAFT,
      executionStats: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0
      }
    });

    await automation.save();

    // Populate platform accounts for response
    await automation.populate('platformAccountIds', 'platform username displayName');

    sendSuccess(res, { automation }, 201, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Update structured automation
   */
  updateAutomation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getAuthenticatedUser(req).id;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid automation ID');
    }

    const automation = await AutomationModel.findOne({
      _id: id,
      userId,
      deletedAt: null
    });

    if (!automation) {
      throw new ApiError(404, 'Automation not found');
    }

    // Don't allow updating active automations
    if (automation.status === AutomationStatus.ACTIVE) {
      throw new ApiError(400, 'Cannot update active automation. Please pause it first.');
    }

    // Get validated data from middleware
    const validatedData = req.validatedData.body;

    // If platform accounts are being changed, validate them
    if (validatedData.platformAccountIds && validatedData.platformAccountIds.length > 0) {
      const platformAccounts = await PlatformAccountModel.find({
        _id: { $in: validatedData.platformAccountIds },
        userId,
        isActive: true
      });

      if (platformAccounts.length !== validatedData.platformAccountIds.length) {
        throw new ApiError(400, 'One or more platform accounts not found or not accessible');
      }

      // Ensure platform matches the existing automation platform
       const invalidAccounts = platformAccounts.filter(account => account.platform !== automation.platform);
       if (invalidAccounts.length > 0) {
         throw new ApiError(400, 'Platform mismatch with selected accounts');
       }
    }

    // Update automation with validated data
    if (validatedData.name) automation.name = validatedData.name;
    if (validatedData.description !== undefined) automation.description = validatedData.description;
    if (validatedData.trigger) {
       // Transform string dates to Date objects for schedule-based triggers
       const trigger = this.transformTriggerWithDates(validatedData.trigger);
       automation.trigger = trigger;
     }
    if (validatedData.actions) automation.actions = validatedData.actions;
    if (validatedData.conditions !== undefined) automation.conditions = validatedData.conditions;
    if (validatedData.settings) {
      automation.settings = {
        ...automation.settings,
        ...validatedData.settings
      };
    }

    if (validatedData.tags !== undefined) automation.tags = validatedData.tags;

    await automation.save();

    // Populate platform account for response
    await automation.populate('platformAccountIds', 'platform username displayName');

    sendSuccess(res, { automation }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Delete automation
   */
  deleteAutomation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getAuthenticatedUser(req).id;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid automation ID');
    }

    const automation = await AutomationModel.findOne({
      _id: id,
      userId,
      deletedAt: null
    });

    if (!automation) {
      throw new ApiError(404, 'Automation not found');
    }

    // Stop automation if it's running
    if (automation.status === AutomationStatus.ACTIVE) {
      automation.status = AutomationStatus.STOPPED;
    }

    automation.deletedAt = new Date();
    await automation.save();

    sendSuccess(res, null, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Start automation
   */
  startAutomation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getAuthenticatedUser(req).id;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid automation ID');
    }

    const automation = await AutomationModel.findOne({
      _id: id,
      userId,
      deletedAt: null
    });

    if (!automation) {
      throw new ApiError(404, 'Automation not found');
    }

    if (automation.status === AutomationStatus.ACTIVE) {
      throw new ApiError(400, 'Automation is already active');
    }

    // Use automation service to start the automation
    const updatedAutomation = await automationService.startAutomation(id);

    sendSuccess(res, { automation: updatedAutomation }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Pause automation
   */
  pauseAutomation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getAuthenticatedUser(req).id;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid automation ID');
    }

    const automation = await AutomationModel.findOne({
      _id: id,
      userId,
      deletedAt: null
    });

    if (!automation) {
      throw new ApiError(404, 'Automation not found');
    }

    if (automation.status !== AutomationStatus.ACTIVE) {
      throw new ApiError(400, 'Automation is not active');
    }

    // Use automation service to pause the automation
    const updatedAutomation = await automationService.pauseAutomation(id);

    sendSuccess(res, { automation: updatedAutomation }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Stop automation
   */
  stopAutomation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getAuthenticatedUser(req).id;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid automation ID');
    }

    const automation = await AutomationModel.findOne({
      _id: id,
      userId,
      deletedAt: null
    });

    if (!automation) {
      throw new ApiError(404, 'Automation not found');
    }

    if (automation.status === AutomationStatus.STOPPED) {
      throw new ApiError(400, 'Automation is already stopped');
    }

    // Use automation service to stop the automation
    const updatedAutomation = await automationService.stopAutomation(id);

    sendSuccess(res, { automation: updatedAutomation }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Execute structured automation manually
   */
  executeAutomation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getAuthenticatedUser(req).id;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid automation ID');
    }

    // Validate request body if test data is provided
    const testData = this.parseTestData(req.body);

    const automation = await AutomationModel.findOne({
      _id: id,
      userId,
      deletedAt: null
    }).populate('platformAccountIds', 'platform username displayName');

    if (!automation) {
      throw new ApiError(404, 'Automation not found');
    }

    // Use automation service to execute the automation with optional test data
    const result = await automationService.executeAutomation(id, testData);

    sendSuccess(res, {
      executionId: result.executionId,
      status: result.success ? 'completed' : 'failed',
      executionTime: result.executionTime,
      actionsExecuted: result.actionsExecuted,
      actionsSuccessful: result.actionsSuccessful,
      actionsFailed: result.actionsFailed,
      message: result.success ? 'Automation executed successfully' : 'Automation execution failed',
      error: result.error,
      logs: result.logs
    }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Get automation analytics
   */
  getAutomationAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getAuthenticatedUser(req).id;
    const { timeRange = '30d', automationId } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    const matchQuery: FilterQuery<AutomationDocument> = {
      userId,
      deletedAt: null,
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (automationId) {
      matchQuery._id = new Types.ObjectId(automationId as string);
    }

    const analytics = await AutomationModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalAutomations: { $sum: 1 },
          activeAutomations: {
            $sum: { $cond: [{ $eq: ['$status', AutomationStatus.ACTIVE] }, 1, 0] }
          },
          pausedAutomations: {
            $sum: { $cond: [{ $eq: ['$status', AutomationStatus.PAUSED] }, 1, 0] }
          },
          totalExecutions: { $sum: '$executionStats.totalExecutions' },
          successfulExecutions: { $sum: '$executionStats.successfulExecutions' },
          failedExecutions: { $sum: '$executionStats.failedExecutions' },
          averageExecutionTime: { $avg: '$executionStats.averageExecutionTime' }
        }
      }
    ]);

    const result = analytics[0] || {
      totalAutomations: 0,
      activeAutomations: 0,
      pausedAutomations: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0
    };

    // Calculate success rate
    result.successRate = result.totalExecutions > 0 
      ? (result.successfulExecutions / result.totalExecutions) * 100 
      : 0;

    sendSuccess(res, {
      analytics: result,
      timeRange,
      period: {
        startDate,
        endDate
      }
    }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Get automation templates
   */
  getAutomationTemplates = asyncHandler(async (req: Request, res: Response) => {
    const { category, search } = req.query;

    // Mock templates data
    const templates = [
      {
        id: 'auto_reply',
        name: 'Auto Reply',
        description: 'Automatically reply to comments and messages',
        triggers: [{ type: TriggerType.INSTAGRAM_COMMENT_RECEIVED }],
        actions: [{ type: ActionType.INSTAGRAM_SEND_MESSAGE }],
        category: 'engagement'
      },
      {
        id: 'content_curation',
        name: 'Content Curation',
        description: 'Automatically curate and share relevant content',
        triggers: [{ type: TriggerType.SCHEDULE_RECURRING }],
        actions: [{ type: ActionType.INSTAGRAM_PUBLISH_POST }],
        category: 'content'
      },
      {
        id: 'engagement_boost',
        name: 'Engagement Boost',
        description: 'Automatically engage with relevant posts and users',
        triggers: [{ type: TriggerType.SCHEDULE_RECURRING }],
        actions: [{ type: ActionType.INSTAGRAM_LIKE_COMMENT }, { type: ActionType.TRACK_ENGAGEMENT }],
        category: 'engagement'
      },
      {
        id: 'analytics_report',
        name: 'Analytics Report',
        description: 'Generate and send periodic analytics reports',
        triggers: [{ type: TriggerType.SCHEDULE_RECURRING }],
        actions: [{ type: ActionType.GENERATE_REPORT }],
        category: 'analytics'
      },
      {
        id: 'cross_posting',
        name: 'Cross Platform Posting',
        description: 'Automatically post content across multiple platforms',
        triggers: [{ type: TriggerType.INSTAGRAM_MEDIA_PUBLISHED }],
        actions: [{ type: ActionType.INSTAGRAM_PUBLISH_POST }],
        category: 'content'
      }
    ];

    // Filter templates
    const filteredTemplates = templates.filter(template => {
      // Filter by category
      if (category && template.category !== category) {
        return false;
      }

      // Filter by search
      if (search) {
        const searchLower = (search as string).toLowerCase();
        return template.name.toLowerCase().includes(searchLower) ||
               template.description.toLowerCase().includes(searchLower);
      }

      return true;
    });

    sendSuccess(res, { templates: filteredTemplates }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Get automation statistics
   */
  getAutomationStats = asyncHandler(async (req: Request, res: Response) => {
    const user = this.getAuthenticatedUser(req);
    
    if (!Types.ObjectId.isValid(user.id)) {
      throw new ApiError(400, 'Invalid user ID');
    }
    
    const userId = new Types.ObjectId(user.id);

    const stats = await automationService.getAutomationStats(userId);

    sendSuccess(res, { stats }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });
}