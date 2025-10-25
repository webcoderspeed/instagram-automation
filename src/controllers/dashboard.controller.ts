import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Types } from 'mongoose';
import { ApiError } from '../utils/api-error';
import { AnalyticsModel } from '../models/analytics.model';
import { PostModel } from '../models/post.model';
import { CampaignModel } from '../models/campaign.model';
import { AutomationModel } from '../models/automation.model';
import { PlatformAccountModel } from '../models/platform-account.model';
import { UserModel } from '../models/user.model';
import { dashboardServices } from '../services/dashboard';
import logger from '../utils/logger';
import { sendSuccess, createMeta } from '../utils/response-builder';

export class DashboardController {
  /**
   * Get dashboard overview stats
   */
  getOverview = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session.user!.id;
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

    const currentFollowers = followerData[0]?.value ?? 0;
    const previousFollowers = followerData[1]?.value ?? currentFollowers;
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

    sendSuccess(res, overview, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Get analytics data
   */
  getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session.user!.id;  
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

    sendSuccess(res, {
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
    }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Get content calendar
   */
  getContentCalendar = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session.user!.id;  
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

    sendSuccess(res, {
      calendar,
      month: Number(month),
      year: Number(year),
      platform
    }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Get recent activity
   */
  getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session.user!.id;  
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
    .sort({ 'executionStats.lastExecutedAt': -1 })
    .limit(Number(limit) / 4)
    .lean();

    // Combine and format activities
    const activities: any[] = [];

    // Add posts
    recentPosts.forEach(post => {
      activities.push({
        id: post._id,
        type: 'post',
        title: `Posted on ${post.platform}`,
        description: post.content?.text?.substring(0, 100) || '',
        timestamp: post.publishedAt,
        platform: post.platform,
        status: post.status
      });
    });

    // Add campaigns
    recentCampaigns.forEach(campaign => {
      activities.push({
        id: campaign._id,
        type: 'campaign',
        title: `Campaign: ${campaign.name}`,
        description: campaign.description || '',
        timestamp: campaign.createdAt,
        status: campaign.status
      });
    });

    // Add automations
    recentAutomations.forEach(automation => {
      activities.push({
        id: automation._id,
        type: 'automation',
        title: `Automation: ${automation.name}`,
        description: automation.description || '',
        timestamp: automation.executionStats?.lastExecutedAt || (automation as any).createdAt,
        status: automation.status
      });
    });

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const paginatedActivities = activities.slice(Number(offset), Number(offset) + Number(limit));

    sendSuccess(res, {
      activities: paginatedActivities,
      total: activities.length,
      limit: Number(limit),
      offset: Number(offset)
    }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Get insights
   */
  getInsights = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session.user!.id;  
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

    // Get best performing posts
    const bestPosts = await PostModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          publishedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'analytics',
          localField: '_id',
          foreignField: 'postId',
          as: 'analytics'
        }
      },
      {
        $addFields: {
          totalEngagement: {
            $sum: {
              $map: {
                input: '$analytics',
                as: 'analytic',
                in: {
                  $cond: [
                    { $in: ['$$analytic.metricType', ['likes', 'comments', 'shares']] },
                    '$$analytic.value',
                    0
                  ]
                }
              }
            }
          }
        }
      },
      {
        $sort: { totalEngagement: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Get optimal posting times
    const postingTimes = await PostModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          publishedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'analytics',
          localField: '_id',
          foreignField: 'postId',
          as: 'analytics'
        }
      },
      {
        $addFields: {
          hour: { $hour: '$publishedAt' },
          dayOfWeek: { $dayOfWeek: '$publishedAt' },
          totalEngagement: {
            $sum: {
              $map: {
                input: '$analytics',
                as: 'analytic',
                in: {
                  $cond: [
                    { $in: ['$$analytic.metricType', ['likes', 'comments', 'shares']] },
                    '$$analytic.value',
                    0
                  ]
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: { hour: '$hour', dayOfWeek: '$dayOfWeek' },
          avgEngagement: { $avg: '$totalEngagement' },
          postCount: { $sum: 1 }
        }
      },
      {
        $sort: { avgEngagement: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get hashtag performance
    const hashtagPerformance = await PostModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          publishedAt: { $gte: startDate, $lte: endDate },
          'content.hashtags': { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: '$content.hashtags'
      },
      {
        $lookup: {
          from: 'analytics',
          localField: '_id',
          foreignField: 'postId',
          as: 'analytics'
        }
      },
      {
        $addFields: {
          totalEngagement: {
            $sum: {
              $map: {
                input: '$analytics',
                as: 'analytic',
                in: {
                  $cond: [
                    { $in: ['$$analytic.metricType', ['likes', 'comments', 'shares']] },
                    '$$analytic.value',
                    0
                  ]
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$content.hashtags',
          avgEngagement: { $avg: '$totalEngagement' },
          usageCount: { $sum: 1 }
        }
      },
      {
        $sort: { avgEngagement: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Generate insights
    const insights = {
      bestPerformingPosts: bestPosts.map(post => ({
        id: post._id,
        content: post.content?.text?.substring(0, 100) || '',
        platform: post.platform,
        publishedAt: post.publishedAt,
        engagement: post.totalEngagement
      })),
      optimalPostingTimes: postingTimes.map(time => ({
        hour: time._id.hour,
        dayOfWeek: time._id.dayOfWeek,
        avgEngagement: time.avgEngagement,
        postCount: time.postCount
      })),
      topHashtags: hashtagPerformance.map(hashtag => ({
        tag: hashtag._id,
        avgEngagement: hashtag.avgEngagement,
        usageCount: hashtag.usageCount
      })),
      recommendations: [
        'Post during peak engagement hours for better reach',
        'Use trending hashtags to increase discoverability',
        'Engage with your audience through comments and stories',
        'Maintain consistent posting schedule'
      ]
    };

    sendSuccess(res, insights, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  /**
   * Get comprehensive stats
   */
  getComprehensiveStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session.user!.id;
    const { timeRange = '30d' } = req.query;

    try {
      // Get full user document from database
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

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

      const stats = await dashboardServices.stats.getDashboardStats(
        user,
        null, // subscription will be fetched internally
        { start: startDate, end: endDate }
      );
      sendSuccess(res, stats, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
    } catch (error) {
      logger.error('Error getting comprehensive stats:', error);
      throw new ApiError(500, 'Failed to get comprehensive stats');
    }
  });

  /**
   * Get detailed analytics
   */
  getDetailedAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session.user!.id;
    const { 
      timeRange = '30d',
      platform,
      metrics = 'all'
    } = req.query;

    try {
      // Get full user document from database
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

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

      const analytics = await dashboardServices.analytics.getAnalyticsData(
        user,
        null, // subscription will be fetched internally
        { start: startDate, end: endDate },
        platform ? [platform as any] : undefined
      );
      sendSuccess(res, analytics, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
    } catch (error) {
      logger.error('Error getting detailed analytics:', error);
      throw new ApiError(500, 'Failed to get detailed analytics');
    }
  });

  /**
   * Get content calendar service
   */
  getContentCalendarService = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.session.user!.id;
    const { 
      startDate,
      endDate,
      platform
    } = req.query;

    try {
      // Get full user document from database
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Calculate date range if not provided
      const start = startDate ? new Date(startDate as string) : new Date();
      const end = endDate ? new Date(endDate as string) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const calendar = await dashboardServices.calendar.getContentCalendar(
        user,
        null, // subscription will be fetched internally
        { start, end },
        platform as string
      );
      sendSuccess(res, calendar, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
    } catch (error) {
      logger.error('Error getting content calendar:', error);
      throw new ApiError(500, 'Failed to get content calendar');
    }
  });
}

export const dashboardController = new DashboardController();