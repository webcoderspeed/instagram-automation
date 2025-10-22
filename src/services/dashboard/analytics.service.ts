/**
 * Dashboard Analytics Service
 * Handles detailed analytics data and metrics calculations
 */

import { UserDocument } from '../../models/user.model';
import { SubscriptionDocument } from '../../models/subscription.model';
import { AnalyticsModel, AnalyticsDocument, MetricTypeType, TimePeriod, PlatformTypeType } from '../../models/analytics.model';
import { PostModel } from '../../models/post.model';
import { roleService } from '../role.service';
import { PERMISSIONS } from '../../constants/permissions';
import logger from '../../utils/logger';
import { AnalyticsData, TimeRange } from './types';

class DashboardAnalyticsService {
  /**
   * Get comprehensive analytics data
   */
  async getAnalyticsData(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    timeRange: TimeRange,
    platforms?: PlatformTypeType[]
  ): Promise<AnalyticsData> {
    // Check permissions
    const permissionCheck = await roleService.checkSubscriptionPermission(
      user,
      subscription,
      PERMISSIONS.ANALYTICS_READ
    );

    if (!permissionCheck.hasPermission) {
      throw new Error(permissionCheck.reason || 'Insufficient permissions');
    }

    try {
      // Build query filters
      const query: any = {
        userId: user._id,
        date: { $gte: timeRange.start, $lte: timeRange.end }
      };

      if (platforms && platforms.length > 0) {
        query.platform = { $in: platforms };
      }

      // Get analytics data
      const analyticsData = await AnalyticsModel.find(query).sort({ date: -1 });

      // Calculate current metrics
      const currentMetrics = this.calculateCurrentMetrics(analyticsData);

      // Calculate growth metrics
      const growthMetrics = await this.calculateGrowthMetrics(user, timeRange, platforms);

      // Generate chart data
      const chartData = this.generateChartData(analyticsData, timeRange);

      // Get platform analytics
      const platformAnalytics = this.getPlatformAnalytics(analyticsData);

      // Get engagement trends
      const engagementTrends = this.getEngagementTrends(analyticsData, timeRange);

      // Get top content
      const topContent = await this.getTopContent(user, timeRange, platforms);

      return {
        timeRange,
        metrics: {
          posts: {
            total: topContent.length,
            growth: 0,
            byPlatform: {}
          },
          engagement: {
            total: currentMetrics.totalLikes + currentMetrics.totalComments + currentMetrics.totalShares,
            average: currentMetrics.engagementRate,
            growth: growthMetrics.engagementRateGrowth,
            byType: {
              likes: currentMetrics.totalLikes,
              comments: currentMetrics.totalComments,
              shares: currentMetrics.totalShares,
              saves: 0
            }
          },
          followers: {
            total: 0,
            growth: 0,
            byPlatform: {}
          },
          reach: {
            total: currentMetrics.totalReach,
            growth: growthMetrics.reachGrowth,
            organic: currentMetrics.totalReach,
            paid: 0
          }
        },
        charts: {
          engagementOverTime: chartData.map((data: any) => ({
            date: data.date,
            value: data.likes + data.comments + data.shares
          })),
          followerGrowth: [],
          postPerformance: chartData.map((data: any) => ({
            date: data.date,
            posts: 1,
            engagement: data.likes + data.comments + data.shares
          }))
        }
      };

    } catch (error) {
      logger.error('Error getting analytics data:', error);
      throw new Error('Failed to retrieve analytics data');
    }
  }

  /**
   * Calculate current metrics from analytics data
   */
  private calculateCurrentMetrics(analyticsData: AnalyticsDocument[]) {
    const metrics = {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalReach: 0,
      totalImpressions: 0,
      engagementRate: 0,
      clickThroughRate: 0
    };

    // Group metrics by type and sum values
    const metricsByType = analyticsData.reduce((acc, data) => {
      const metricType = data.metricType;
      if (!acc[metricType]) {
        acc[metricType] = 0;
      }
      acc[metricType] += data.value || 0;

      // Add additional metrics if available
      if (data.additionalMetrics) {
        if (data.additionalMetrics instanceof Map) {
          data.additionalMetrics.forEach((value, key) => {
            if (!acc[key]) {
              acc[key] = 0;
            }
            acc[key] += value || 0;
          });
        } else {
          // Handle as Record<string, number>
          Object.entries(data.additionalMetrics).forEach(([key, value]) => {
            if (!acc[key]) {
              acc[key] = 0;
            }
            acc[key] += value || 0;
          });
        }
      }

      return acc;
    }, {} as Record<string, number>);

    // Map to our metrics structure
    metrics.totalViews = metricsByType['views'] || 0;
    metrics.totalLikes = metricsByType['likes'] || 0;
    metrics.totalComments = metricsByType['comments'] || 0;
    metrics.totalShares = metricsByType['shares'] || 0;
    metrics.totalReach = metricsByType['reach'] || metricsByType['organicReach'] || 0;
    metrics.totalImpressions = metricsByType['impressions'] || 0;

    // Calculate engagement rate
    const totalEngagement = metrics.totalLikes + metrics.totalComments + metrics.totalShares;
    metrics.engagementRate = metrics.totalViews > 0 ? 
      (totalEngagement / metrics.totalViews) * 100 : 0;

    // Calculate click-through rate (if available)
    metrics.clickThroughRate = metricsByType['clickThroughRate'] || 0;

    return metrics;
  }

  /**
   * Calculate growth metrics compared to previous period
   */
  private async calculateGrowthMetrics(
    user: UserDocument,
    timeRange: TimeRange,
    platforms?: PlatformTypeType[]
  ) {
    try {
      // Calculate previous period
      const periodDuration = timeRange.end.getTime() - timeRange.start.getTime();
      const previousStart = new Date(timeRange.start.getTime() - periodDuration);
      const previousEnd = new Date(timeRange.start.getTime());

      // Build query for previous period
      const previousQuery: any = {
        userId: user._id,
        date: { $gte: previousStart, $lte: previousEnd }
      };

      if (platforms && platforms.length > 0) {
        previousQuery.platform = { $in: platforms };
      }

      // Get previous period data
      const previousData = await AnalyticsModel.find(previousQuery);
      const previousMetrics = this.calculateCurrentMetrics(previousData);

      // Get current period data
      const currentQuery: any = {
        userId: user._id,
        date: { $gte: timeRange.start, $lte: timeRange.end }
      };

      if (platforms && platforms.length > 0) {
        currentQuery.platform = { $in: platforms };
      }

      const currentData = await AnalyticsModel.find(currentQuery);
      const currentMetrics = this.calculateCurrentMetrics(currentData);

      // Calculate growth percentages
      const calculateGrowth = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      return {
        viewsGrowth: calculateGrowth(currentMetrics.totalViews, previousMetrics.totalViews),
        likesGrowth: calculateGrowth(currentMetrics.totalLikes, previousMetrics.totalLikes),
        commentsGrowth: calculateGrowth(currentMetrics.totalComments, previousMetrics.totalComments),
        sharesGrowth: calculateGrowth(currentMetrics.totalShares, previousMetrics.totalShares),
        reachGrowth: calculateGrowth(currentMetrics.totalReach, previousMetrics.totalReach),
        impressionsGrowth: calculateGrowth(currentMetrics.totalImpressions, previousMetrics.totalImpressions),
        engagementRateGrowth: calculateGrowth(currentMetrics.engagementRate, previousMetrics.engagementRate)
      };

    } catch (error) {
      logger.error('Error calculating growth metrics:', error);
      return {
        viewsGrowth: 0,
        likesGrowth: 0,
        commentsGrowth: 0,
        sharesGrowth: 0,
        reachGrowth: 0,
        impressionsGrowth: 0,
        engagementRateGrowth: 0
      };
    }
  }

  /**
   * Generate chart data for visualization
   */
  private generateChartData(analyticsData: AnalyticsDocument[], timeRange: TimeRange) {
    // Group data by date
    const dataByDate = analyticsData.reduce((acc, data) => {
      const dateKey = data.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          reach: 0,
          impressions: 0
        };
      }

      // Add metrics based on type
      switch (data.metricType) {
        case 'views':
          acc[dateKey].views += data.value || 0;
          break;
        case 'likes':
          acc[dateKey].likes += data.value || 0;
          break;
        case 'comments':
          acc[dateKey].comments += data.value || 0;
          break;
        case 'shares':
          acc[dateKey].shares += data.value || 0;
          break;
        case 'reach':
          acc[dateKey].reach += data.value || 0;
          break;
        case 'impressions':
          acc[dateKey].impressions += data.value || 0;
          break;
      }

      return acc;
    }, {} as Record<string, any>);

    // Convert to array and sort by date
    return Object.values(dataByDate).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  /**
   * Get platform-specific analytics
   */
  private getPlatformAnalytics(analyticsData: AnalyticsDocument[]) {
    const platformData = analyticsData.reduce((acc, data) => {
      const platform = data.platform;
      if (!acc[platform]) {
        acc[platform] = {
          platform,
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          reach: 0,
          impressions: 0,
          posts: new Set()
        };
      }

      // Add metrics
      switch (data.metricType) {
        case 'views':
          acc[platform].views += data.value || 0;
          break;
        case 'likes':
          acc[platform].likes += data.value || 0;
          break;
        case 'comments':
          acc[platform].comments += data.value || 0;
          break;
        case 'shares':
          acc[platform].shares += data.value || 0;
          break;
        case 'reach':
          acc[platform].reach += data.value || 0;
          break;
        case 'impressions':
          acc[platform].impressions += data.value || 0;
          break;
      }

      // Track unique posts
      if (data.postId) {
        acc[platform].posts.add(data.postId.toString());
      }

      return acc;
    }, {} as Record<string, any>);

    // Convert sets to counts and calculate engagement rates
    return Object.values(platformData).map((platform: any) => ({
      ...platform,
      posts: platform.posts.size,
      engagementRate: platform.views > 0 ? 
        ((platform.likes + platform.comments + platform.shares) / platform.views) * 100 : 0
    }));
  }

  /**
   * Get engagement trends over time
   */
  private getEngagementTrends(analyticsData: AnalyticsDocument[], timeRange: TimeRange) {
    const trendData = this.generateChartData(analyticsData, timeRange);
    
    return trendData.map((data: any) => ({
      date: data.date,
      engagementRate: data.views > 0 ? 
        ((data.likes + data.comments + data.shares) / data.views) * 100 : 0,
      totalEngagement: data.likes + data.comments + data.shares,
      views: data.views
    }));
  }

  /**
   * Get top performing content
   */
  private async getTopContent(
    user: UserDocument,
    timeRange: TimeRange,
    platforms?: PlatformTypeType[]
  ) {
    try {
      // Build query for posts
      const query: any = {
        userId: user._id,
        publishedAt: { $gte: timeRange.start, $lte: timeRange.end },
        status: 'published'
      };

      if (platforms && platforms.length > 0) {
        query.platform = { $in: platforms };
      }

      // Get posts with analytics data
      const posts = await PostModel.find(query)
        .sort({ 'analytics.likes': -1 })
        .limit(10);

      return posts.map(post => ({
        id: (post._id as any).toString(),
        content: post.content?.text?.substring(0, 100) + 
          (post.content?.text && post.content.text.length > 100 ? '...' : '') || 'No content',
        platform: post.platform,
        publishedAt: post.publishedAt,
        analytics: {
          views: post.analytics?.views || 0,
          likes: post.analytics?.likes || 0,
          comments: post.analytics?.comments || 0,
          shares: post.analytics?.shares || 0,
          engagementRate: post.analytics?.engagementRate || 0,
          totalEngagement: (post.analytics?.likes || 0) + 
            (post.analytics?.comments || 0) + (post.analytics?.shares || 0)
        }
      }));

    } catch (error) {
      logger.error('Error getting top content:', error);
      return [];
    }
  }

  /**
   * Get analytics summary for a specific platform
   */
  async getPlatformSummary(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    platform: PlatformTypeType,
    timeRange: TimeRange
  ) {
    // Check permissions
    const permissionCheck = await roleService.checkSubscriptionPermission(
      user,
      subscription,
      PERMISSIONS.ANALYTICS_READ
    );

    if (!permissionCheck.hasPermission) {
      throw new Error(permissionCheck.reason || 'Insufficient permissions');
    }

    try {
      const analyticsData = await AnalyticsModel.find({
        userId: user._id,
        platform,
        date: { $gte: timeRange.start, $lte: timeRange.end }
      });

      const metrics = this.calculateCurrentMetrics(analyticsData);
      const chartData = this.generateChartData(analyticsData, timeRange);
      const topContent = await this.getTopContent(user, timeRange, [platform]);

      return {
        platform,
        metrics,
        chartData,
        topContent,
        timeRange
      };

    } catch (error) {
      logger.error(`Error getting ${platform} analytics summary:`, error);
      throw new Error(`Failed to retrieve ${platform} analytics summary`);
    }
  }

  /**
   * Get real-time analytics data
   */
  async getRealTimeAnalytics(
    user: UserDocument,
    subscription: SubscriptionDocument | null
  ) {
    // Check permissions
    const permissionCheck = await roleService.checkSubscriptionPermission(
      user,
      subscription,
      PERMISSIONS.ANALYTICS_READ
    );

    if (!permissionCheck.hasPermission) {
      throw new Error(permissionCheck.reason || 'Insufficient permissions');
    }

    try {
      // Get data from last 24 hours
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      const recentData = await AnalyticsModel.find({
        userId: user._id,
        timestamp: { $gte: last24Hours }
      }).sort({ timestamp: -1 });

      // Get recent posts performance
      const recentPosts = await PostModel.find({
        userId: user._id,
        publishedAt: { $gte: last24Hours }
      }).sort({ publishedAt: -1 }).limit(5);

      return {
        recentMetrics: this.calculateCurrentMetrics(recentData),
        recentPosts: recentPosts.map(post => ({
          id: (post._id as any).toString(),
          content: post.content?.text?.substring(0, 50) + 
            (post.content?.text && post.content.text.length > 50 ? '...' : '') || 'No content',
          platform: post.platform,
          publishedAt: post.publishedAt,
          analytics: post.analytics
        })),
        lastUpdated: new Date()
      };

    } catch (error) {
      logger.error('Error getting real-time analytics:', error);
      throw new Error('Failed to retrieve real-time analytics');
    }
  }
}

export const dashboardAnalyticsService = new DashboardAnalyticsService();