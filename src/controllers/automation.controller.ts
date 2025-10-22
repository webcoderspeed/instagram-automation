/**
 * Automation Controller
 * Handles automation management, execution, and analytics
 */

import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import asyncHandler from 'express-async-handler';
import { ApiError } from '../utils/api-error';
import { AutomationModel, AutomationStatus, AutomationType, TriggerType } from '../models/automation.model';
import { PlatformAccountModel } from '../models/platform-account.model';
import { automationService } from '../services/automation.service';
import logger from '../utils/logger';

export class AutomationController {
  /**
   * Helper method to get authenticated user
   */
  private getAuthenticatedUser(req: Request) {
    if (!req.user) {
      throw ApiError.unauthorized('User not authenticated');
    }
    return req.user;
  }

  /**
   * Get all automations for user
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

    const offset = (Number(page) - 1) * Number(limit);
    
    // Build query
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
        .sort(sort)
        .skip(offset)
        .limit(Number(limit))
        .populate('platformAccounts', 'platform platformUsername')
        .lean(),
      AutomationModel.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        automations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1
        }
      }
    });
  });

  /**
   * Get single automation
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
    }).populate('platformAccounts', 'platform platformUsername').lean();

    if (!automation) {
      throw new ApiError(404, 'Automation not found');
    }

    res.json({
      success: true,
      data: { automation }
    });
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

    res.status(201).json({
      success: true,
      data: { automation },
      message: 'Automation created successfully'
    });
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

    res.json({
      success: true,
      data: { automation },
      message: 'Automation updated successfully'
    });
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

    res.json({
      success: true,
      message: 'Automation deleted successfully'
    });
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

    res.json({
      success: true,
      data: { automation: updatedAutomation },
      message: 'Automation started successfully'
    });
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

    res.json({
      success: true,
      data: { automation: updatedAutomation },
      message: 'Automation paused successfully'
    });
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

    res.json({
      success: true,
      data: { automation: updatedAutomation },
      message: 'Automation stopped successfully'
    });
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

    res.json({
      success: true,
      data: {
        executionId: new Types.ObjectId().toString(),
        status: result.success ? 'completed' : 'failed',
        executionTime: result.executionTime,
        data: result.data,
        message: result.success ? 'Automation executed successfully' : 'Automation execution failed',
        error: result.error
      }
    });
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

    res.json({
      success: true,
      data: {
        analytics: result,
        timeRange,
        period: {
          startDate,
          endDate
        }
      }
    });
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

    res.json({
      success: true,
      data: { templates }
    });
  });

  /**
   * Get automation statistics
   */
  getAutomationStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = new Types.ObjectId(this.getAuthenticatedUser(req).id);

    const stats = await automationService.getAutomationStats(userId);

    res.json({
      success: true,
      data: { stats },
      message: 'Automation statistics retrieved successfully'
    });
  });
}