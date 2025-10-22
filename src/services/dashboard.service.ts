/**
 * Dashboard Service
 * Provides analytics, statistics, and content calendar data for the SaaS dashboard
 */

import { UserDocument } from '../models/user.model';
import { SubscriptionDocument } from '../models/subscription.model';
import { AnalyticsModel, MetricType } from '../models/analytics.model';
import { AutomationModel } from '../models/automation.model';
import { PlatformAccountModel } from '../models/platform-account.model';
import { NotificationModel } from '../models/notification.model';
import { roleService } from './role.service';
import { PERMISSIONS } from '../constants/permissions';
import logger from '../utils/logger';

export interface DashboardStats {
  overview: {
    totalPosts: number;
    totalFollowers: number;
    totalEngagement: number;
    totalAutomations: number;
    activeAutomations: number;
    connectedAccounts: number;
    monthlyGrowth: number;
  };
  performance: {
    topPosts: Array<{
      id: string;
      content: string;
      platform: string;
      likes: number;
      comments: number;
      shares: number;
      engagement: number;
      publishedAt: Date;
    }>;
    engagementTrend: Array<{
      date: string;
      likes: number;
      comments: number;
      shares: number;
      followers: number;
    }>;
    platformBreakdown: Array<{
      platform: string;
      posts: number;
      engagement: number;
      followers: number;
    }>;
  };
  automation: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    averageExecutionTime: number;
    recentActivity: Array<{
      id: string;
      name: string;
      status: string;
      lastRun: Date;
      nextRun?: Date;
    }>;
  };
  notifications: {
    unread: number;
    recent: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      createdAt: Date;
      isRead: boolean;
    }>;
  };
}

export interface ContentCalendar {
  events: Array<{
    id: string;
    title: string;
    content: string;
    platform: string;
    scheduledAt: Date;
    status: 'scheduled' | 'published' | 'failed' | 'draft';
    type: 'post' | 'story' | 'reel' | 'automation';
    tags?: string[];
    mediaUrls?: string[];
  }>;
  summary: {
    totalScheduled: number;
    thisWeek: number;
    thisMonth: number;
    byPlatform: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

export interface AnalyticsData {
  timeRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    posts: {
      total: number;
      growth: number;
      byPlatform: Record<string, number>;
    };
    engagement: {
      total: number;
      average: number;
      growth: number;
      byType: {
        likes: number;
        comments: number;
        shares: number;
        saves: number;
      };
    };
    followers: {
      total: number;
      growth: number;
      byPlatform: Record<string, number>;
    };
    reach: {
      total: number;
      growth: number;
      organic: number;
      paid: number;
    };
  };
  charts: {
    engagementOverTime: Array<{
      date: string;
      value: number;
    }>;
    followerGrowth: Array<{
      date: string;
      value: number;
    }>;
    postPerformance: Array<{
      date: string;
      posts: number;
      engagement: number;
    }>;
  };
}

class DashboardService {
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    }
  ): Promise<DashboardStats> {
    // Check permissions
    const permissionCheck = await roleService.checkSubscriptionPermission(
      user,
      subscription,
      PERMISSIONS.ANALYTICS_DASHBOARD
    );

    if (!permissionCheck.hasPermission) {
      throw new Error(permissionCheck.reason || 'Insufficient permissions');
    }

    try {
      // Get user's platform accounts
      const platformAccounts = await PlatformAccountModel.find({
        userId: user._id,
        isActive: true
      });

      // Get analytics data - aggregate different metric types
      const likesData = await AnalyticsModel.find({
        userId: user._id,
        metricType: MetricType.LIKES,
        date: { $gte: timeRange.start, $lte: timeRange.end }
      }).sort({ date: -1 });

      const commentsData = await AnalyticsModel.find({
        userId: user._id,
        metricType: MetricType.COMMENTS,
        date: { $gte: timeRange.start, $lte: timeRange.end }
      }).sort({ date: -1 });

      const sharesData = await AnalyticsModel.find({
        userId: user._id,
        metricType: MetricType.SHARES,
        date: { $gte: timeRange.start, $lte: timeRange.end }
      }).sort({ date: -1 });

      const followersData = await AnalyticsModel.find({
        userId: user._id,
        metricType: MetricType.FOLLOWERS,
        date: { $gte: timeRange.start, $lte: timeRange.end }
      }).sort({ date: -1 });

      // Get automation data
      const automations = await AutomationModel.find({
        userId: user._id,
        deletedAt: null
      });

      // Get notifications
      const notifications = await NotificationModel.find({
        userId: user._id
      }).sort({ createdAt: -1 }).limit(10);

      // Calculate overview stats
      const totalLikes = likesData.reduce((sum, data) => sum + data.value, 0);
      const totalComments = commentsData.reduce((sum, data) => sum + data.value, 0);
      const totalShares = sharesData.reduce((sum, data) => sum + data.value, 0);
      const totalEngagement = totalLikes + totalComments + totalShares;
      const totalFollowers = platformAccounts.reduce((sum, account) => sum + (account.stats?.totalFollowers || 0), 0);
      
      // Estimate total posts from platform accounts
      const totalPosts = platformAccounts.reduce((sum, account) => sum + (account.stats?.totalPosts || 0), 0);

      // Calculate previous period for growth
      const previousPeriodStart = new Date(timeRange.start.getTime() - (timeRange.end.getTime() - timeRange.start.getTime()));
      const previousLikesData = await AnalyticsModel.find({
        userId: user._id,
        metricType: MetricType.LIKES,
        date: { $gte: previousPeriodStart, $lt: timeRange.start }
      });

      const previousCommentsData = await AnalyticsModel.find({
        userId: user._id,
        metricType: MetricType.COMMENTS,
        date: { $gte: previousPeriodStart, $lt: timeRange.start }
      });

      const previousSharesData = await AnalyticsModel.find({
        userId: user._id,
        metricType: MetricType.SHARES,
        date: { $gte: previousPeriodStart, $lt: timeRange.start }
      });

      const previousTotalLikes = previousLikesData.reduce((sum, data) => sum + data.value, 0);
      const previousTotalComments = previousCommentsData.reduce((sum, data) => sum + data.value, 0);
      const previousTotalShares = previousSharesData.reduce((sum, data) => sum + data.value, 0);
      const previousTotalEngagement = previousTotalLikes + previousTotalComments + previousTotalShares;
      
      const monthlyGrowth = previousTotalEngagement > 0 ? ((totalEngagement - previousTotalEngagement) / previousTotalEngagement) * 100 : 0;

      // Get top performing posts (simplified - would need a separate posts collection for real data)
      const topPosts = likesData
        .filter(data => data.postId)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map(data => ({
          id: data.postId?.toString() || '',
          content: 'Post content', // Would need to fetch from posts collection
          platform: data.platform,
          likes: data.value,
          comments: commentsData.find(c => c.postId?.toString() === data.postId?.toString())?.value || 0,
          shares: sharesData.find(s => s.postId?.toString() === data.postId?.toString())?.value || 0,
          engagement: data.value + (commentsData.find(c => c.postId?.toString() === data.postId?.toString())?.value || 0) + (sharesData.find(s => s.postId?.toString() === data.postId?.toString())?.value || 0),
          publishedAt: data.date
        }));

      // Calculate engagement trend (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const engagementTrend = last7Days.map(dateStr => {
        const date = new Date(dateStr);
        const dayLikes = likesData.filter(d => d.date.toISOString().split('T')[0] === dateStr)
          .reduce((sum, d) => sum + d.value, 0);
        const dayComments = commentsData.filter(d => d.date.toISOString().split('T')[0] === dateStr)
          .reduce((sum, d) => sum + d.value, 0);
        const dayShares = sharesData.filter(d => d.date.toISOString().split('T')[0] === dateStr)
          .reduce((sum, d) => sum + d.value, 0);
        const dayFollowers = followersData.filter(d => d.date.toISOString().split('T')[0] === dateStr)
          .reduce((sum, d) => sum + d.value, 0);

        return {
          date: dateStr,
          likes: dayLikes,
          comments: dayComments,
          shares: dayShares,
          followers: dayFollowers
        };
      });

      // Platform breakdown
      const platformBreakdown = platformAccounts.map(account => ({
        platform: account.platform,
        posts: account.stats?.totalPosts || 0,
        engagement: likesData.filter(data => data.platform === account.platform)
          .reduce((sum, data) => sum + data.value, 0) +
          commentsData.filter(data => data.platform === account.platform)
          .reduce((sum, data) => sum + data.value, 0) +
          sharesData.filter(data => data.platform === account.platform)
          .reduce((sum, data) => sum + data.value, 0),
        followers: account.stats?.totalFollowers || 0
      }));

      // Automation stats
      const activeAutomations = automations.filter(auto => auto.status === 'active').length;
      const totalRuns = automations.reduce((sum, auto) => sum + auto.analytics.totalRuns, 0);
      const successfulRuns = automations.reduce((sum, auto) => sum + auto.successCount, 0);
      const failedRuns = automations.reduce((sum, auto) => sum + auto.failureCount, 0);

      const recentAutomationActivity = automations
        .filter(auto => auto.lastExecutedAt)
        .sort((a, b) => (b.lastExecutedAt?.getTime() || 0) - (a.lastExecutedAt?.getTime() || 0))
        .slice(0, 5)
        .map(auto => ({
          id: auto._id.toString(),
          name: auto.name,
          status: auto.status,
          lastRun: auto.lastExecutedAt!,
          nextRun: auto.nextExecutionAt
        }));

      // Notification stats
      const unreadNotifications = notifications.filter(notif => !notif.readAt).length;
      const recentNotifications = notifications.slice(0, 5).map(notif => ({
        id: notif._id.toString(),
        type: notif.type,
        title: notif.title,
        message: notif.message,
        createdAt: notif.createdAt,
        isRead: !!notif.readAt
      }));

      return {
        overview: {
          totalPosts,
          totalFollowers,
          totalEngagement,
          totalAutomations: automations.length,
          activeAutomations,
          connectedAccounts: platformAccounts.length,
          monthlyGrowth
        },
        performance: {
          topPosts,
          engagementTrend,
          platformBreakdown
        },
        automation: {
          totalRuns,
          successfulRuns,
          failedRuns,
          averageExecutionTime: automations.length > 0 ? 
            automations.reduce((sum, auto) => sum + auto.analytics.avgExecutionTime, 0) / automations.length : 0,
          recentActivity: recentAutomationActivity
        },
        notifications: {
          unread: unreadNotifications,
          recent: recentNotifications
        }
      };

    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      throw new Error('Failed to retrieve dashboard statistics');
    }
  }

  /**
   * Get content calendar data
   */
  async getContentCalendar(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    timeRange: { start: Date; end: Date } = {
      start: new Date(),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
  ): Promise<ContentCalendar> {
    // Check permissions
    const permissionCheck = await roleService.checkSubscriptionPermission(
      user,
      subscription,
      PERMISSIONS.POST_SCHEDULE
    );

    if (!permissionCheck.hasPermission) {
      throw new Error(permissionCheck.reason || 'Insufficient permissions');
    }

    try {
      // Get scheduled posts from analytics (assuming they store scheduled content)
      const scheduledContent = await AnalyticsModel.find({
        userId: user._id,
        scheduledAt: { $gte: timeRange.start, $lte: timeRange.end }
      }).sort({ scheduledAt: 1 });

      // Get automation schedules
      const automations = await AutomationModel.find({
        userId: user._id,
        isActive: true,
        nextExecutionAt: { $gte: timeRange.start, $lte: timeRange.end }
      });

      const events = [
        // Scheduled posts
        ...scheduledContent.map(content => ({
          id: content._id.toString(),
          title: content.postDetails?.[0]?.content?.substring(0, 50) + '...' || 'Scheduled Post',
          content: content.postDetails?.[0]?.content || '',
          platform: content.platform,
          scheduledAt: content.scheduledAt || content.date,
          status: content.status || 'scheduled' as const,
          type: 'post' as const,
          tags: content.tags,
          mediaUrls: content.postDetails?.[0]?.mediaUrls
        })),
        // Automation schedules
        ...automations.map(automation => ({
          id: automation._id.toString(),
          title: `Automation: ${automation.name}`,
          content: automation.description || '',
          platform: 'multiple',
          scheduledAt: automation.nextExecutionAt!,
          status: 'scheduled' as const,
          type: 'automation' as const
        }))
      ].sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

      // Calculate summary
      const totalScheduled = events.length;
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const thisWeek = events.filter(event => 
        event.scheduledAt >= now && event.scheduledAt <= oneWeekFromNow
      ).length;

      const thisMonth = events.filter(event => 
        event.scheduledAt >= now && event.scheduledAt <= oneMonthFromNow
      ).length;

      const byPlatform = events.reduce((acc, event) => {
        acc[event.platform] = (acc[event.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byStatus = events.reduce((acc, event) => {
        acc[event.status] = (acc[event.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        events,
        summary: {
          totalScheduled,
          thisWeek,
          thisMonth,
          byPlatform,
          byStatus
        }
      };

    } catch (error) {
      logger.error('Error getting content calendar:', error);
      throw new Error('Failed to retrieve content calendar');
    }
  }

  /**
   * Get detailed analytics data
   */
  async getAnalyticsData(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    timeRange: { start: Date; end: Date },
    platform?: string
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
      const query: any = {
        userId: user._id,
        date: { $gte: timeRange.start, $lte: timeRange.end }
      };

      if (platform) {
        query.platform = platform;
      }

      const analyticsData = await AnalyticsModel.find(query).sort({ date: 1 });

      // Calculate metrics
      const totalPosts = analyticsData.reduce((sum, data) => sum + (data.metrics.posts || 0), 0);
      const totalEngagement = analyticsData.reduce((sum, data) => 
        sum + (data.metrics.likes || 0) + (data.metrics.comments || 0) + (data.metrics.shares || 0), 0
      );
      const totalFollowers = analyticsData.length > 0 ? 
        analyticsData[analyticsData.length - 1].metrics.followers || 0 : 0;
      const totalReach = analyticsData.reduce((sum, data) => sum + (data.metrics.reach || 0), 0);

      // Calculate growth (compare with previous period)
      const periodLength = timeRange.end.getTime() - timeRange.start.getTime();
      const previousPeriodStart = new Date(timeRange.start.getTime() - periodLength);
      const previousData = await AnalyticsModel.find({
        userId: user._id,
        date: { $gte: previousPeriodStart, $lt: timeRange.start },
        ...(platform && { platform })
      });

      const previousPosts = previousData.reduce((sum, data) => sum + (data.metrics.posts || 0), 0);
      const previousEngagement = previousData.reduce((sum, data) => 
        sum + (data.metrics.likes || 0) + (data.metrics.comments || 0) + (data.metrics.shares || 0), 0
      );
      const previousFollowers = previousData.length > 0 ? 
        previousData[previousData.length - 1].metrics.followers || 0 : 0;
      const previousReach = previousData.reduce((sum, data) => sum + (data.metrics.reach || 0), 0);

      const postsGrowth = previousPosts > 0 ? ((totalPosts - previousPosts) / previousPosts) * 100 : 0;
      const engagementGrowth = previousEngagement > 0 ? ((totalEngagement - previousEngagement) / previousEngagement) * 100 : 0;
      const followersGrowth = previousFollowers > 0 ? ((totalFollowers - previousFollowers) / previousFollowers) * 100 : 0;
      const reachGrowth = previousReach > 0 ? ((totalReach - previousReach) / previousReach) * 100 : 0;

      // Platform breakdown
      const byPlatform = analyticsData.reduce((acc, data) => {
        acc[data.platform] = (acc[data.platform] || 0) + (data.metrics.posts || 0);
        return acc;
      }, {} as Record<string, number>);

      const followersByPlatform = analyticsData.reduce((acc, data) => {
        if (!acc[data.platform] || data.metrics.followers > acc[data.platform]) {
          acc[data.platform] = data.metrics.followers || 0;
        }
        return acc;
      }, {} as Record<string, number>);

      // Chart data
      const engagementOverTime = analyticsData.map(data => ({
        date: data.date.toISOString().split('T')[0],
        value: (data.metrics.likes || 0) + (data.metrics.comments || 0) + (data.metrics.shares || 0)
      }));

      const followerGrowth = analyticsData.map(data => ({
        date: data.date.toISOString().split('T')[0],
        value: data.metrics.followers || 0
      }));

      const postPerformance = analyticsData.map(data => ({
        date: data.date.toISOString().split('T')[0],
        posts: data.metrics.posts || 0,
        engagement: (data.metrics.likes || 0) + (data.metrics.comments || 0) + (data.metrics.shares || 0)
      }));

      return {
        timeRange,
        metrics: {
          posts: {
            total: totalPosts,
            growth: postsGrowth,
            byPlatform
          },
          engagement: {
            total: totalEngagement,
            average: totalPosts > 0 ? totalEngagement / totalPosts : 0,
            growth: engagementGrowth,
            byType: {
              likes: analyticsData.reduce((sum, data) => sum + (data.metrics.likes || 0), 0),
              comments: analyticsData.reduce((sum, data) => sum + (data.metrics.comments || 0), 0),
              shares: analyticsData.reduce((sum, data) => sum + (data.metrics.shares || 0), 0),
              saves: analyticsData.reduce((sum, data) => sum + (data.metrics.saves || 0), 0)
            }
          },
          followers: {
            total: totalFollowers,
            growth: followersGrowth,
            byPlatform: followersByPlatform
          },
          reach: {
            total: totalReach,
            growth: reachGrowth,
            organic: analyticsData.reduce((sum, data) => sum + (data.metrics.organicReach || 0), 0),
            paid: analyticsData.reduce((sum, data) => sum + (data.metrics.paidReach || 0), 0)
          }
        },
        charts: {
          engagementOverTime,
          followerGrowth,
          postPerformance
        }
      };

    } catch (error) {
      logger.error('Error getting analytics data:', error);
      throw new Error('Failed to retrieve analytics data');
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(
    user: UserDocument,
    subscription: SubscriptionDocument | null
  ): Promise<{
    lastLogin: Date | null;
    totalSessions: number;
    averageSessionDuration: number;
    mostActiveHour: number;
    recentActions: Array<{
      action: string;
      timestamp: Date;
      details: string;
    }>;
  }> {
    try {
      // This would typically come from user activity logs
      // For now, return basic data from user model
      return {
        lastLogin: user.lastLoginAt || null,
        totalSessions: 0, // Would be tracked in activity logs
        averageSessionDuration: 0, // Would be calculated from session data
        mostActiveHour: 14, // Default to 2 PM
        recentActions: [
          {
            action: 'Login',
            timestamp: user.lastLoginAt || new Date(),
            details: 'User logged in'
          }
        ]
      };
    } catch (error) {
      logger.error('Error getting user activity summary:', error);
      throw new Error('Failed to retrieve user activity summary');
    }
  }
}

export const dashboardService = new DashboardService();