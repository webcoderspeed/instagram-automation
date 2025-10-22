/**
 * Dashboard Activity Service
 * Handles user activity tracking and session management
 */

import { UserDocument } from '../../models/user.model';
import { SubscriptionDocument } from '../../models/subscription.model';
import { PostModel } from '../../models/post.model';
import { AutomationModel } from '../../models/automation.model';
import { roleService } from '../role.service';
import { PERMISSIONS } from '../../constants/permissions';
import logger from '../../utils/logger';
import { UserActivitySummary, TimeRange } from './types';

class DashboardActivityService {
  /**
   * Get user activity summary
   */
  async getUserActivitySummary(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    timeRange: TimeRange
  ): Promise<UserActivitySummary> {
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
      // Get login activity data
      const loginActivity = await this.getLoginActivity(user, timeRange);

      // Calculate most active hour (simplified)
      const mostActiveHour = this.calculateMostActiveHour(user);

      // Get recent actions
      const recentActions = await this.getRecentActions(user, timeRange);

      return {
        lastLogin: user.lastLoginAt || null,
        totalSessions: loginActivity.totalSessions,
        averageSessionDuration: loginActivity.averageSessionDuration,
        mostActiveHour,
        recentActions
      };

    } catch (error) {
      logger.error('Error getting user activity summary:', error);
      throw new Error('Failed to retrieve user activity summary');
    }
  }

  /**
   * Get recent posts activity
   */
  async getRecentPosts(user: UserDocument, timeRange: TimeRange) {
    const posts = await PostModel.find({
      userId: user._id,
      $or: [
        { createdAt: { $gte: timeRange.start, $lte: timeRange.end } },
        { publishedAt: { $gte: timeRange.start, $lte: timeRange.end } },
        { scheduledAt: { $gte: timeRange.start, $lte: timeRange.end } }
      ]
    }).sort({ createdAt: -1 }).limit(10).lean();

    return posts.map(post => ({
      id: String(post._id),
      content: post.content?.text?.substring(0, 100) + (post.content?.text && post.content.text.length > 100 ? '...' : '') || 'No content',
      platform: post.platform,
      status: post.status,
      createdAt: post.createdAt,
      publishedAt: post.publishedAt,
      scheduledAt: post.scheduledAt,
      engagement: {
        likes: post.analytics?.likes || 0,
        comments: post.analytics?.comments || 0,
        shares: post.analytics?.shares || 0,
        views: post.analytics?.views || 0
      }
    }));
  }

  /**
   * Get recent automations activity
   */
  async getRecentAutomations(user: UserDocument, timeRange: TimeRange) {
    const automations = await AutomationModel.find({
      userId: user._id,
      $or: [
        { createdAt: { $gte: timeRange.start, $lte: timeRange.end } },
        { updatedAt: { $gte: timeRange.start, $lte: timeRange.end } }
      ]
    }).sort({ updatedAt: -1 }).limit(10).lean();

    return automations.map(automation => ({
      id: String(automation._id),
      name: automation.name,
      type: automation.type,
      status: automation.status || 'inactive',
      createdAt: automation.createdAt,
      updatedAt: automation.updatedAt
    }));
  }

  /**
   * Get login activity data
   */
  private async getLoginActivity(user: UserDocument, timeRange: TimeRange) {
    // This would typically come from a session/login tracking system
    // For now, we'll simulate based on user data
    const totalSessions = this.estimateSessionCount(user, timeRange);
    const averageSessionDuration = this.estimateAverageSessionDuration(user);

    return {
      totalSessions,
      averageSessionDuration,
      lastLogin: user.lastLoginAt || user.updatedAt
    };
  }

  /**
   * Calculate most active hour (simplified estimation)
   */
  private calculateMostActiveHour(user: UserDocument): number {
    // This is a simplified estimation - in a real app, you'd track actual activity patterns
    // Default to 10 AM as most active hour
    return 10;
  }

  /**
   * Get recent actions
   */
  private async getRecentActions(user: UserDocument, timeRange: TimeRange) {
    try {
      const [recentPosts, recentAutomations] = await Promise.all([
        PostModel.find({
          userId: user._id,
          createdAt: { $gte: timeRange.start, $lte: timeRange.end }
        }).sort({ createdAt: -1 }).limit(5).lean(),
        AutomationModel.find({
          userId: user._id,
          createdAt: { $gte: timeRange.start, $lte: timeRange.end }
        }).sort({ createdAt: -1 }).limit(5).lean()
      ]);

      const actions = [
        ...recentPosts.map(post => ({
          action: `Created post for ${post.platform}`,
          timestamp: (post as any).createdAt,
          details: post.content?.text?.substring(0, 50) + (post.content?.text && post.content.text.length > 50 ? '...' : '') || 'No content'
        })),
        ...recentAutomations.map(automation => ({
          action: `Created automation: ${automation.name}`,
          timestamp: automation.createdAt,
          details: automation.type || 'Unknown type'
        }))
      ];

      return actions
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);

    } catch (error) {
      logger.error('Error getting recent actions:', error);
      return [];
    }
  }

  /**
   * Estimate session count based on user activity
   */
  private estimateSessionCount(user: UserDocument, timeRange: TimeRange): number {
    // This is a simplified estimation - in a real app, you'd track actual sessions
    const daysDiff = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const lastLoginDays = user.lastLoginAt ? 
      Math.ceil((new Date().getTime() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)) : 30;
    
    // Estimate based on recency of last login and time range
    if (lastLoginDays <= 1) return Math.min(daysDiff * 2, 30); // Very active
    if (lastLoginDays <= 7) return Math.min(daysDiff, 20); // Active
    if (lastLoginDays <= 30) return Math.min(Math.ceil(daysDiff / 2), 10); // Moderate
    return Math.min(Math.ceil(daysDiff / 7), 5); // Low activity
  }

  /**
   * Estimate average session duration
   */
  private estimateAverageSessionDuration(user: UserDocument): number {
    // This is a simplified estimation - in a real app, you'd track actual session durations
    // Return duration in minutes
    const lastLoginDays = user.lastLoginAt ? 
      Math.ceil((new Date().getTime() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)) : 30;
    
    if (lastLoginDays <= 1) return 45; // Very active users spend more time
    if (lastLoginDays <= 7) return 30; // Active users
    if (lastLoginDays <= 30) return 20; // Moderate users
    return 15; // Low activity users
  }

  /**
   * Get recent activity feed
   */
  async getRecentActivityFeed(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    limit: number = 20
  ): Promise<any[]> {
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
      const [recentPosts, recentAutomations] = await Promise.all([
        PostModel.find({ userId: user._id })
          .sort({ updatedAt: -1 })
          .limit(limit / 2)
          .lean(),
        AutomationModel.find({ userId: user._id })
          .sort({ updatedAt: -1 })
          .limit(limit / 2)
          .lean()
      ]);

      // Combine and sort activities
      const activities = [
        ...recentPosts.map(post => ({
          id: String(post._id),
          type: 'post',
          action: this.getPostAction(post),
          title: post.content?.text?.substring(0, 50) + (post.content?.text && post.content.text.length > 50 ? '...' : '') || 'Untitled Post',
          platform: post.platform,
          timestamp: (post as any).updatedAt,
          status: post.status,
          metadata: {
            likes: post.analytics?.likes || 0,
            comments: post.analytics?.comments || 0,
            shares: post.analytics?.shares || 0
          }
        })),
        ...recentAutomations.map(automation => ({
          id: String(automation._id),
          type: 'automation',
          action: 'created',
          title: automation.name,
          platform: 'multiple',
          timestamp: automation.updatedAt,
          status: automation.status || 'inactive',
          metadata: {
            type: automation.type
          }
        }))
      ];

      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);

    } catch (error) {
      logger.error('Error getting recent activity feed:', error);
      throw new Error('Failed to retrieve recent activity feed');
    }
  }

  /**
   * Get post action based on status and dates
   */
  private getPostAction(post: any): string {
    if (post.publishedAt) return 'published';
    if (post.scheduledAt && post.status === 'scheduled') return 'scheduled';
    if (post.status === 'draft') return 'drafted';
    return 'created';
  }

  /**
   * Get user engagement summary
   */
  async getUserEngagementSummary(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    timeRange: TimeRange
  ): Promise<{
    totalEngagement: number;
    averageEngagementRate: number;
    topPerformingPosts: any[];
    platformBreakdown: Record<string, number>;
  }> {
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
      // Get posts with engagement data
      const posts = await PostModel.find({
        userId: user._id,
        publishedAt: { $gte: timeRange.start, $lte: timeRange.end },
        status: 'published'
      }).sort({ 'analytics.likes': -1 });

      // Calculate total engagement
      const totalEngagement = posts.reduce((sum, post) => {
        const engagement = (post.analytics?.likes || 0) + 
                          (post.analytics?.comments || 0) + 
                          (post.analytics?.shares || 0);
        return sum + engagement;
      }, 0);

      // Calculate average engagement rate
      const totalViews = posts.reduce((sum, post) => sum + (post.analytics?.views || 0), 0);
      const averageEngagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

      // Get top performing posts
      const topPerformingPosts = posts.slice(0, 5).map(post => ({
        id: String(post._id),
        content: post.content?.text?.substring(0, 100) + (post.content?.text && post.content.text.length > 100 ? '...' : '') || 'No content',
        platform: post.platform,
        publishedAt: post.publishedAt,
        engagement: {
          likes: post.analytics?.likes || 0,
          comments: post.analytics?.comments || 0,
          shares: post.analytics?.shares || 0,
          views: post.analytics?.views || 0,
          total: (post.analytics?.likes || 0) + (post.analytics?.comments || 0) + (post.analytics?.shares || 0)
        }
      }));

      // Calculate platform breakdown
      const platformBreakdown = posts.reduce((acc, post) => {
        const engagement = (post.analytics?.likes || 0) + 
                          (post.analytics?.comments || 0) + 
                          (post.analytics?.shares || 0);
        acc[post.platform] = (acc[post.platform] || 0) + engagement;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalEngagement,
        averageEngagementRate: Math.round(averageEngagementRate * 100) / 100,
        topPerformingPosts,
        platformBreakdown
      };

    } catch (error) {
      logger.error('Error getting user engagement summary:', error);
      throw new Error('Failed to retrieve user engagement summary');
    }
  }
}

export const dashboardActivityService = new DashboardActivityService();