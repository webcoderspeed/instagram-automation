import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import asyncHandler from 'express-async-handler';
import { ApiError } from '../utils/api-error';
import { AutomationModel, AutomationStatus, AutomationType, TriggerType } from '../models/automation.model';
import { PlatformAccountModel } from '../models/platform-account.model';
import { automationService } from '../services/automation.service';
import logger from '../utils/logger';
import { sendSuccess, createMeta } from '../utils/response-builder';

export class AutomationController {
  /**
   * Get authenticated user from request
   */
  private getAuthenticatedUser(req: Request): any {
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
      type, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {
      userId,
      deletedAt: null
    };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }

    // Build sort
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const [automations, total] = await Promise.all([
      AutomationModel.find(query)
        .populate('platformAccounts', 'platform username')
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
    }).populate('platformAccounts', 'platform username').lean();

    if (!automation) {
      throw new ApiError(404, 'Automation not found');
    }

    sendSuccess(res, { automation }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Create new automation
   */
  createAutomation = asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getAuthenticatedUser(req).id;
    const {
      name,
      description,
      type,
      config,
      platformAccounts,
      maxExecutions,
      dailyLimit,
      monthlyLimit,
      tags
    } = req.body;

    // Validate platform accounts belong to user
    if (platformAccounts && platformAccounts.length > 0) {
      const userPlatformAccounts = await PlatformAccountModel.find({
        _id: { $in: platformAccounts },
        userId,
        isActive: true
      });

      if (userPlatformAccounts.length !== platformAccounts.length) {
        throw new ApiError(400, 'One or more platform accounts are invalid or not accessible');
      }
    }

    const automation = new AutomationModel({
      userId,
      name,
      description,
      type,
      config: config || { triggers: [], actions: [] },
      platformAccounts: platformAccounts || [],
      maxExecutions,
      dailyLimit,
      monthlyLimit,
      tags: tags || [],
      status: AutomationStatus.INACTIVE,
      analytics: {
        totalRuns: 0,
        successRate: 0,
        avgExecutionTime: 0,
        errorCount: 0
      }
    });

    await automation.save();

    sendSuccess(res, { automation }, 201, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Update automation
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

    // Don't allow updating running automations
    if (automation.status === AutomationStatus.ACTIVE) {
      throw new ApiError(400, 'Cannot update active automation. Please pause it first.');
    }

    const updateData = { ...req.body };
    delete updateData.userId; // Prevent userId modification
    delete updateData.analytics; // Prevent analytics modification

    Object.assign(automation, updateData);
    await automation.save();

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
      automation.status = AutomationStatus.INACTIVE;
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

    if (automation.status === AutomationStatus.INACTIVE) {
      throw new ApiError(400, 'Automation is already stopped');
    }

    // Use automation service to stop the automation
    const updatedAutomation = await automationService.stopAutomation(id);

    sendSuccess(res, { automation: updatedAutomation }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Execute automation manually
   */
  executeAutomation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getAuthenticatedUser(req).id;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid automation ID');
    }

    const automation = await AutomationModel.findOne({
      _id: id,
      userId,
      deletedAt: null
    }).populate('platformAccounts');

    if (!automation) {
      throw new ApiError(404, 'Automation not found');
    }

    // Use automation service to execute the automation
    const result = await automationService.executeAutomation(id);

    sendSuccess(res, {
      executionId: new Types.ObjectId().toString(),
      status: result.success ? 'completed' : 'failed',
      executionTime: result.executionTime,
      data: result.data,
      message: result.success ? 'Automation executed successfully' : 'Automation execution failed',
      error: result.error
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

    const matchQuery: any = {
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
          totalExecutions: { $sum: '$executionCount' },
          successfulExecutions: { $sum: '$successCount' },
          failedExecutions: { $sum: '$failureCount' },
          averageExecutionTime: { $avg: '$analytics.avgExecutionTime' }
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
    let templates = [
      {
        id: 'auto_reply',
        name: 'Auto Reply',
        description: 'Automatically reply to comments and messages',
        type: AutomationType.AUTO_REPLY,
        triggers: [{ type: TriggerType.EVENT }],
        actions: [{ type: 'send_reply' }],
        category: 'engagement'
      },
      {
        id: 'content_curation',
        name: 'Content Curation',
        description: 'Automatically curate and share relevant content',
        type: AutomationType.CONTENT_CURATION,
        triggers: [{ type: TriggerType.SCHEDULE }],
        actions: [{ type: 'curate_content' }, { type: 'create_post' }],
        category: 'content'
      },
      {
        id: 'engagement_boost',
        name: 'Engagement Boost',
        description: 'Automatically engage with relevant posts and users',
        type: AutomationType.ENGAGEMENT,
        triggers: [{ type: TriggerType.SCHEDULE }],
        actions: [{ type: 'like_posts' }, { type: 'follow_users' }],
        category: 'engagement'
      },
      {
        id: 'analytics_report',
        name: 'Analytics Report',
        description: 'Generate and send periodic analytics reports',
        type: AutomationType.ANALYTICS_REPORT,
        triggers: [{ type: TriggerType.SCHEDULE }],
        actions: [{ type: 'generate_report' }, { type: 'send_email' }],
        category: 'analytics'
      },
      {
        id: 'cross_posting',
        name: 'Cross Platform Posting',
        description: 'Automatically post content across multiple platforms',
        type: AutomationType.CROSS_POSTING,
        triggers: [{ type: TriggerType.EVENT }],
        actions: [{ type: 'cross_post' }],
        category: 'content'
      }
    ];

    // Filter by category
    if (category) {
      templates = templates.filter(template => template.category === category);
    }

    // Filter by search
    if (search) {
      const searchLower = (search as string).toLowerCase();
      templates = templates.filter(template => 
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower)
      );
    }

    sendSuccess(res, { templates }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Get automation statistics
   */
  getAutomationStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = new Types.ObjectId(this.getAuthenticatedUser(req).id);

    const stats = await automationService.getAutomationStats(userId);

    sendSuccess(res, { stats }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });
}