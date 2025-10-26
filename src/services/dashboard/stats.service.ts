/**
 * Dashboard Stats Service
 * Handles dashboard overview statistics and performance metrics
 */

import { UserDocument } from '../../models/user.model';
import { SubscriptionDocument } from '../../models/subscription.model';
import { AnalyticsModel, MetricType, MetricTypeType } from '../../models/analytics.model';
import { AutomationModel } from '../../models/automation.model';
import { PlatformAccountModel } from '../../models/platform-account.model';
import { PostModel } from '../../models/post.model';
import { NotificationModel } from '../../models/notification.model';
import { PlatformAccountEncryption } from '../../utils/platform-account-encryption';
import { roleService } from '../role.service';
import { PERMISSIONS } from '../../constants/permissions';
import logger from '../../utils/logger';
import { DashboardStats, TimeRange } from './types';

class DashboardStatsService {
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    timeRange: TimeRange = {
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

      // Decrypt tokens after retrieval
      PlatformAccountEncryption.decryptTokensForArray(platformAccounts);

      // Get analytics data - aggregate different metric types
      const [likesData, commentsData, sharesData, followersData] = await Promise.all([
        this.getMetricData(user._id, MetricType.LIKES, timeRange),
        this.getMetricData(user._id, MetricType.COMMENTS, timeRange),
        this.getMetricData(user._id, MetricType.SHARES, timeRange),
        this.getMetricData(user._id, MetricType.FOLLOWERS, timeRange)
      ]);

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
      const overview = await this.calculateOverviewStats(
        platformAccounts,
        likesData,
        commentsData,
        sharesData,
        automations,
        timeRange
      );

      // Calculate performance metrics
      const performance = await this.calculatePerformanceMetrics(
        likesData,
        commentsData,
        sharesData,
        followersData,
        platformAccounts
      );

      // Calculate automation stats
      const automation = this.calculateAutomationStats(automations);

      // Calculate notification stats
      const notificationStats = this.calculateNotificationStats(notifications);

      return {
        overview,
        performance,
        automation,
        notifications: notificationStats
      };

    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      throw new Error('Failed to retrieve dashboard statistics');
    }
  }

  /**
   * Get metric data for a specific type and time range
   */
  private async getMetricData(userId: any, metricType: MetricTypeType, timeRange: TimeRange) {
    return await AnalyticsModel.find({
      userId,
      metricType,
      date: { $gte: timeRange.start, $lte: timeRange.end }
    }).sort({ date: -1 });
  }

  /**
   * Calculate overview statistics
   */
  private async calculateOverviewStats(
    platformAccounts: any[],
    likesData: any[],
    commentsData: any[],
    sharesData: any[],
    automations: any[],
    timeRange: TimeRange
  ) {
    const totalLikes = likesData.reduce((sum, data) => sum + data.value, 0);
    const totalComments = commentsData.reduce((sum, data) => sum + data.value, 0);
    const totalShares = sharesData.reduce((sum, data) => sum + data.value, 0);
    const totalEngagement = totalLikes + totalComments + totalShares;
    const totalFollowers = platformAccounts.reduce((sum, account) => sum + (account.stats?.totalFollowers || 0), 0);
    const totalPosts = platformAccounts.reduce((sum, account) => sum + (account.stats?.totalPosts || 0), 0);

    // Calculate growth
    const monthlyGrowth = await this.calculateGrowthRate(
      likesData[0]?.userId,
      timeRange,
      totalEngagement
    );

    return {
      totalPosts,
      totalFollowers,
      totalEngagement,
      totalAutomations: automations.length,
      activeAutomations: automations.filter(auto => auto.status === 'active').length,
      connectedAccounts: platformAccounts.length,
      monthlyGrowth
    };
  }

  /**
   * Calculate performance metrics
   */
  private async calculatePerformanceMetrics(
    likesData: any[],
    commentsData: any[],
    sharesData: any[],
    followersData: any[],
    platformAccounts: any[]
  ) {
    // Get top performing posts
    const topPosts = this.getTopPosts(likesData, commentsData, sharesData);

    // Calculate engagement trend (last 7 days)
    const engagementTrend = this.calculateEngagementTrend(
      likesData,
      commentsData,
      sharesData,
      followersData
    );

    // Platform breakdown
    const platformBreakdown = this.calculatePlatformBreakdown(
      platformAccounts,
      likesData,
      commentsData,
      sharesData
    );

    return {
      topPosts,
      engagementTrend,
      platformBreakdown
    };
  }

  /**
   * Get top performing posts
   */
  private getTopPosts(likesData: any[], commentsData: any[], sharesData: any[]) {
    return likesData
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
        engagement: data.value + 
          (commentsData.find(c => c.postId?.toString() === data.postId?.toString())?.value || 0) + 
          (sharesData.find(s => s.postId?.toString() === data.postId?.toString())?.value || 0),
        publishedAt: data.date
      }));
  }

  /**
   * Calculate engagement trend for last 7 days
   */
  private calculateEngagementTrend(
    likesData: any[],
    commentsData: any[],
    sharesData: any[],
    followersData: any[]
  ) {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(dateStr => {
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
  }

  /**
   * Calculate platform breakdown
   */
  private calculatePlatformBreakdown(
    platformAccounts: any[],
    likesData: any[],
    commentsData: any[],
    sharesData: any[]
  ) {
    return platformAccounts.map(account => ({
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
  }

  /**
   * Calculate automation statistics
   */
  private calculateAutomationStats(automations: any[]) {
    const totalRuns = automations.reduce((sum, auto) => sum + auto.analytics.totalRuns, 0);
    const successfulRuns = automations.reduce((sum, auto) => sum + auto.successCount, 0);
    const failedRuns = automations.reduce((sum, auto) => sum + auto.failureCount, 0);

    const recentActivity = automations
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

    return {
      totalRuns,
      successfulRuns,
      failedRuns,
      averageExecutionTime: automations.length > 0 ? 
        automations.reduce((sum, auto) => sum + auto.analytics.avgExecutionTime, 0) / automations.length : 0,
      recentActivity
    };
  }

  /**
   * Calculate notification statistics
   */
  private calculateNotificationStats(notifications: any[]) {
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
      unread: unreadNotifications,
      recent: recentNotifications
    };
  }

  /**
   * Calculate growth rate compared to previous period
   */
  private async calculateGrowthRate(userId: any, timeRange: TimeRange, currentEngagement: number) {
    const periodLength = timeRange.end.getTime() - timeRange.start.getTime();
    const previousPeriodStart = new Date(timeRange.start.getTime() - periodLength);

    const [previousLikesData, previousCommentsData, previousSharesData] = await Promise.all([
      AnalyticsModel.find({
        userId,
        metricType: MetricType.LIKES,
        date: { $gte: previousPeriodStart, $lt: timeRange.start }
      }),
      AnalyticsModel.find({
        userId,
        metricType: MetricType.COMMENTS,
        date: { $gte: previousPeriodStart, $lt: timeRange.start }
      }),
      AnalyticsModel.find({
        userId,
        metricType: MetricType.SHARES,
        date: { $gte: previousPeriodStart, $lt: timeRange.start }
      })
    ]);

    const previousTotalEngagement = 
      previousLikesData.reduce((sum, data) => sum + data.value, 0) +
      previousCommentsData.reduce((sum, data) => sum + data.value, 0) +
      previousSharesData.reduce((sum, data) => sum + data.value, 0);

    return previousTotalEngagement > 0 ? 
      ((currentEngagement - previousTotalEngagement) / previousTotalEngagement) * 100 : 0;
  }
}

export const dashboardStatsService = new DashboardStatsService();