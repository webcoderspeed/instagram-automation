import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { Types } from 'mongoose';
import { ApiError } from '../utils/api-error';
import { AnalyticsModel } from '../models/analytics.model';
import { PostModel } from '../models/post.model';
import { CampaignModel } from '../models/campaign.model';
import { AutomationModel } from '../models/automation.model';
import { PlatformAccountModel } from '../models/platform-account.model';
import { UserModel } from '../models/user.model';
import { SubscriptionModel } from '../models/subscription.model';
import { dashboardServices } from '../services/dashboard';
import { AuthenticatedUser } from '../types/user.types';
import logger from '../utils/logger';
import type { PlatformTypeType } from '../models/analytics.model';

export class DashboardController {
  /**
   * Get dashboard overview stats
   */
  getOverview = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const timeRange = req.query.timeRange as string || '30d';
    
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

    // Get connected accounts count
    const connectedAccounts = await PlatformAccountModel.countDocuments({
      userId,
      isActive: true
    });

    // Get total posts count
    const totalPosts = await PostModel.countDocuments({
      userId,
      publishedAt: { $gte: startDate, $lte: endDate }
    });

    // Get active automations count
    const activeAutomations = await AutomationModel.countDocuments({
      userId,
      status: 'active'
    });

    // Get total campaigns count
    const totalCampaigns = await CampaignModel.countDocuments({
      userId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Get engagement metrics from analytics
    const engagementData = await AnalyticsModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate },
          metricType: { $in: ['likes', 'comments', 'shares', 'views'] }
        }
      },
      {
        $group: {
          _id: '$metricType',
          total: { $sum: '$value' }
        }
      }
    ]);

    const engagementMetrics = {
      totalLikes: engagementData.find(item => item._id === 'likes')?.total || 0,
      totalComments: engagementData.find(item => item._id === 'comments')?.total || 0,
      totalShares: engagementData.find(item => item._id === 'shares')?.total || 0,
      totalViews: engagementData.find(item => item._id === 'views')?.total || 0,
      engagementRate: 0 // Will calculate below
    };

    // Calculate engagement rate
    const totalEngagement = engagementMetrics.totalLikes + engagementMetrics.totalComments + engagementMetrics.totalShares;
    engagementMetrics.engagementRate = engagementMetrics.totalViews > 0 
      ? Math.round((totalEngagement / engagementMetrics.totalViews) * 100 * 100) / 100 
      : 0;

    // Get follower growth from analytics
    const followerData = await AnalyticsModel.find({
      userId,
      metricType: 'followers',
      date: { $gte: startDate, $lte: endDate }
    })
    .sort({ date: -1 })
    .limit(2)
    .lean();

    const currentFollowers = followerData[0]?.value || 0;
    const previousFollowers = followerData[1]?.value || currentFollowers;
    const growth = currentFollowers - previousFollowers;
    const growthRate = previousFollowers > 0 ? Math.round((growth / previousFollowers) * 100 * 100) / 100 : 0;

    const followerGrowth = {
      current: currentFollowers,
      previous: previousFollowers,
      growth,
      growthRate
    };

    // Get recent posts performance
    const recentPosts = await PostModel.find({
      userId,
      publishedAt: { $gte: startDate, $lte: endDate }
    })
    .sort({ publishedAt: -1 })
    .limit(5)
    .lean();

    // Get analytics for recent posts
    const postIds = recentPosts.map(post => post._id);
    const postAnalytics = await AnalyticsModel.aggregate([
      {
        $match: {
          postId: { $in: postIds },
          metricType: { $in: ['likes', 'comments', 'shares'] }
        }
      },
      {
        $group: {
          _id: { postId: '$postId', metricType: '$metricType' },
          total: { $sum: '$value' }
        }
      }
    ]);

    const overview = {
      connectedAccounts,
      totalPosts,
      activeAutomations,
      totalCampaigns,
      engagementMetrics,
      followerGrowth,
      recentPosts: recentPosts.map(post => {
        const postMetrics = postAnalytics.filter(metric => 
          metric._id.postId.toString() === post._id.toString()
        );
        
        return {
          id: post._id,
          content: post.content?.text?.substring(0, 100) || '',
          platform: post.platform,
          publishedAt: post.publishedAt,
          metrics: {
            likes: postMetrics.find(m => m._id.metricType === 'likes')?.total || 0,
            comments: postMetrics.find(m => m._id.metricType === 'comments')?.total || 0,
            shares: postMetrics.find(m => m._id.metricType === 'shares')?.total || 0
          }
        };
      }),
      timeRange
    };

    res.json({
      success: true,
      data: overview
    });
  });

  /**
   * Get analytics data
   */
  getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { 
      timeRange = '30d', 
      platform, 
      metric = 'engagement' 
    } = req.query;

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

    // Build query
    const query: any = {
      userId,
      date: { $gte: startDate, $lte: endDate }
    };

    if (platform) {
      query.platform = platform;
    }

    // Add metric type filter
    if (metric) {
      query.metricType = metric;
    }

    // Get analytics data
    const analytics = await AnalyticsModel.find(query)
      .sort({ date: 1 })
      .lean();

    // Process analytics data
    const processedData = analytics.map(item => ({
      date: item.date,
      value: item.value || 0,
      metricType: item.metricType,
      platform: item.platform,
      changePercent: item.changePercent || 0
    }));

    // Calculate summary statistics
    const totalValue = processedData.reduce((sum, item) => sum + item.value, 0);
    const averageValue = processedData.length > 0 ? totalValue / processedData.length : 0;
    const maxValue = processedData.length > 0 ? Math.max(...processedData.map(item => item.value)) : 0;
    const minValue = processedData.length > 0 ? Math.min(...processedData.map(item => item.value)) : 0;

    // Calculate growth rate
    const firstValue = processedData[0]?.value || 0;
    const lastValue = processedData[processedData.length - 1]?.value || 0;
    const growthRate = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    res.json({
      success: true,
      data: {
        analytics: processedData,
        summary: {
          total: totalValue,
          average: averageValue,
          max: maxValue,
          min: minValue,
          growthRate
        },
        timeRange,
        metric,
        platform
      }
    });
  });

  /**
   * Get content calendar
   */
  getContentCalendar = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { 
      month = new Date().getMonth() + 1,
      year = new Date().getFullYear(),
      platform 
    } = req.query;

    // Calculate date range for the month
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    // Build query
    const query: any = {
      userId,
      $or: [
        { publishedAt: { $gte: startDate, $lte: endDate } },
        { scheduledAt: { $gte: startDate, $lte: endDate } }
      ]
    };

    if (platform) {
      query.platform = platform;
    }

    // Get posts for the month
    const posts = await PostModel.find(query)
      .sort({ publishedAt: 1, scheduledAt: 1 })
      .lean();

    // Group posts by date
    const calendar: Record<string, any[]> = {};
    
    posts.forEach(post => {
      const date = (post.publishedAt || post.scheduledAt)?.toISOString().split('T')[0];
      if (date) {
        if (!calendar[date]) {
          calendar[date] = [];
        }
        
        calendar[date].push({
          id: post._id,
          content: post.content?.text?.substring(0, 100) || '',
          platform: post.platform,
          status: post.status,
          publishedAt: post.publishedAt,
          scheduledAt: post.scheduledAt,
          mediaCount: post.content?.media?.length || 0
        });
      }
    });

    // Get campaign events for the month
    const campaigns = await CampaignModel.find({
      userId,
      $or: [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
        { 
          startDate: { $lte: startDate },
          endDate: { $gte: endDate }
        }
      ]
    }).lean();

    // Add campaigns to calendar
    campaigns.forEach(campaign => {
      const startDateStr = campaign.startDate?.toISOString().split('T')[0];
      const endDateStr = campaign.endDate?.toISOString().split('T')[0];
      
      if (startDateStr) {
        if (!calendar[startDateStr]) {
          calendar[startDateStr] = [];
        }
        
        calendar[startDateStr].push({
          id: campaign._id,
          type: 'campaign',
          name: campaign.name,
          status: campaign.status,
          startDate: campaign.startDate,
          endDate: campaign.endDate
        });
      }
    });

    res.json({
      success: true,
      data: {
        calendar,
        month: Number(month),
        year: Number(year),
        platform
      }
    });
  });

  /**
   * Get recent activity
   */
  getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { limit = 20, offset = 0 } = req.query;

    // Get recent posts
    const recentPosts = await PostModel.find({
      userId,
      publishedAt: { $exists: true }
    })
    .sort({ publishedAt: -1 })
    .limit(Number(limit) / 2)
    .lean();

    // Get recent campaigns
    const recentCampaigns = await CampaignModel.find({
      userId
    })
    .sort({ createdAt: -1 })
    .limit(Number(limit) / 4)
    .lean();

    // Get recent automations
    const recentAutomations = await AutomationModel.find({
      userId
    })
    .sort({ lastExecutedAt: -1 })
    .limit(Number(limit) / 4)
    .lean();

    // Combine and format activities
    const activities: any[] = [];

    // Add posts
    recentPosts.forEach(post => {
      activities.push({
        id: post._id,
        type: 'post',
        action: 'published',
        title: `Post published on ${post.platform}`,
        description: post.content?.text?.substring(0, 100) || '',
        timestamp: post.publishedAt,
        platform: post.platform,
        metadata: {
          postId: post._id,
          mediaCount: post.content?.media?.length || 0
        }
      });
    });

    // Add campaigns
    recentCampaigns.forEach(campaign => {
      activities.push({
        id: campaign._id,
        type: 'campaign',
        action: 'created',
        title: `Campaign "${campaign.name}" created`,
        description: campaign.description || '',
        timestamp: campaign.updatedAt,
        metadata: {
          campaignId: campaign._id,
          status: campaign.status
        }
      });
    });

    // Add automations
    recentAutomations.forEach(automation => {
      activities.push({
        id: automation._id,
        type: 'automation',
        action: 'executed',
        title: `Automation "${automation.name}" executed`,
        description: automation.description || '',
        timestamp: automation.lastExecutedAt,
        metadata: {
          automationId: automation._id,
          status: automation.status
        }
      });
    });

    // Sort by timestamp and apply pagination
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const paginatedActivities = activities.slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      success: true,
      data: {
        activities: paginatedActivities,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: activities.length,
          hasMore: Number(offset) + Number(limit) < activities.length
        }
      }
    });
  });

  /**
   * Get insights and recommendations
   */
  getInsights = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const timeRange = req.query.timeRange as string || '30d';

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
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get user's posts for analysis
    const posts = await PostModel.find({
      userId,
      publishedAt: { $gte: startDate, $lte: endDate }
    }).lean();

    // Get user's analytics
    const analytics = await AnalyticsModel.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
      metricType: 'engagement'
    }).lean();

    // Generate insights based on data
    const insights = [];

    // Best performing content type
    if (posts.length > 0) {
      const contentTypes = posts.reduce((acc: any, post) => {
        const hasMedia = post.content?.media && post.content.media.length > 0;
        const type = hasMedia ? 'media' : 'text';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      const bestType = Object.keys(contentTypes).reduce((a, b) => 
        contentTypes[a] > contentTypes[b] ? a : b
      );

      insights.push({
        type: 'content_performance',
        title: 'Best Performing Content Type',
        description: `${bestType === 'media' ? 'Posts with media' : 'Text posts'} perform best for your audience`,
        recommendation: `Consider creating more ${bestType === 'media' ? 'visual content' : 'text-based posts'}`,
        priority: 'high',
        category: 'content'
      });
    }

    // Optimal posting time
    if (analytics.length > 0) {
      const hourlyEngagement = analytics.reduce((acc: any, item) => {
        const hour = new Date(item.date).getHours();
        acc[hour] = (acc[hour] || 0) + (item.value || 0);
        return acc;
      }, {});

      const bestHour = Object.keys(hourlyEngagement).reduce((a, b) => 
        hourlyEngagement[a] > hourlyEngagement[b] ? a : b
      );

      insights.push({
        type: 'timing_optimization',
        title: 'Optimal Posting Time',
        description: `Your audience is most engaged around ${bestHour}:00`,
        recommendation: `Schedule more posts between ${bestHour}:00 - ${(Number(bestHour) + 2) % 24}:00`,
        priority: 'medium',
        category: 'timing'
      });
    }

    // Engagement trend
    if (analytics.length >= 7) {
      const recentEngagement = analytics.slice(-7).reduce((sum, item) => sum + (item.value || 0), 0) / 7;
      const previousEngagement = analytics.slice(-14, -7).reduce((sum, item) => sum + (item.value || 0), 0) / 7;
      
      const trend = recentEngagement > previousEngagement ? 'increasing' : 'decreasing';
      const change = previousEngagement > 0 ? Math.abs(((recentEngagement - previousEngagement) / previousEngagement) * 100) : 0;

      insights.push({
        type: 'engagement_trend',
        title: `Engagement is ${trend}`,
        description: `Your engagement rate has ${trend === 'increasing' ? 'improved' : 'declined'} by ${change.toFixed(1)}%`,
        recommendation: trend === 'increasing' 
          ? 'Keep up the great work! Continue with your current content strategy'
          : 'Consider experimenting with different content types or posting times',
        priority: trend === 'decreasing' ? 'high' : 'low',
        category: 'performance'
      });
    }

    // Automation opportunities
    const automationCount = await AutomationModel.countDocuments({
      userId,
      status: 'active'
    });

    if (automationCount < 3) {
      insights.push({
        type: 'automation_opportunity',
        title: 'Automation Opportunity',
        description: 'You could save time by automating more of your social media tasks',
        recommendation: 'Set up automated responses, content scheduling, or engagement workflows',
        priority: 'medium',
        category: 'automation'
      });
    }

    res.json({
      success: true,
      data: {
        insights,
        timeRange,
        generatedAt: new Date()
      }
    });
  });

  /**
   * Get comprehensive dashboard stats using dashboard service
   */
  getComprehensiveStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { timeRange = '30d' } = req.query;
    
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

    try {
      // Get user and subscription documents
      const user = await UserModel.findById(userId);
      if (!user) {
        throw ApiError.notFound('User not found');
      }
      
      const subscription = await SubscriptionModel.findOne({ userId });
      
      const stats = await dashboardServices.stats.getDashboardStats(
        user,
        subscription,
        { start: startDate, end: endDate }
      );
      
      res.json({
        success: true,
        data: stats,
        meta: {
          timeRange,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error fetching comprehensive dashboard stats:', error);
      throw ApiError.internal('Failed to fetch dashboard statistics');
    }
  });

  /**
   * Get detailed analytics using dashboard service
   */
  getDetailedAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { period = '30d', platform } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
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
    
    try {
      // Get user and subscription documents
      const user = await UserModel.findById(userId);
      if (!user) {
        throw ApiError.notFound('User not found');
      }
      
      const subscription = await SubscriptionModel.findOne({ userId });
      
      const analytics = await dashboardServices.analytics.getAnalyticsData(
        user,
        subscription,
        { start: startDate, end: endDate },
        platform ? [platform as PlatformTypeType] : undefined
      );
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error fetching detailed analytics:', error);
      throw ApiError.internal('Failed to fetch analytics data');
    }
  });

  /**
   * Get content calendar using dashboard service
   */
  getContentCalendarService = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { month, year } = req.query;
    
    // Calculate date range for calendar
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month as string) - 1 : currentDate.getMonth();
    const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();
    
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0);
    
    try {
      // Get user and subscription documents
      const user = await UserModel.findById(userId);
      if (!user) {
        throw ApiError.notFound('User not found');
      }
      
      const subscription = await SubscriptionModel.findOne({ userId });
      
      const calendar = await dashboardServices.calendar.getContentCalendar(
        user,
        subscription,
        { start: startDate, end: endDate }
      );
      
      res.json({
        success: true,
        data: calendar
      });
    } catch (error) {
      logger.error('Error fetching content calendar:', error);
      throw ApiError.internal('Failed to fetch content calendar');
    }
  });
}

export const dashboardController = new DashboardController();