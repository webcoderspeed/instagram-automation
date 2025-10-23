/**
 * Dashboard Calendar Service
 * Handles content calendar functionality and scheduling
 */

import { UserDocument } from '../../models/user.model';
import { SubscriptionDocument } from '../../models/subscription.model';
import { PostModel } from '../../models/post.model';
import { AutomationModel, AutomationStatus, AutomationDocument } from '../../models/automation.model';
import { roleService } from '../role.service';
import { PERMISSIONS } from '../../constants/permissions';
import logger from '../../utils/logger';
import { ContentCalendar, TimeRange } from './types';

class DashboardCalendarService {
  /**
   * Get content calendar data
   */
  async getContentCalendar(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    timeRange: TimeRange,
    platform?: string
  ): Promise<ContentCalendar> {
    // Check permissions
    const permissionCheck = await roleService.checkSubscriptionPermission(
      user,
      subscription,
      PERMISSIONS.POST_READ
    );

    if (!permissionCheck.hasPermission) {
      throw new Error(permissionCheck.reason || 'Insufficient permissions');
    }

    try {
      // Build query for scheduled posts
      const postQuery: any = {
        userId: user._id,
        scheduledAt: { $gte: timeRange.start, $lte: timeRange.end }
      };

      if (platform) {
        postQuery.platform = platform;
      }

      // Exclude deleted posts from calendar
      postQuery.status = { $ne: 'deleted' };

      // Build query for automations
      const automationQuery: any = {
        userId: user._id,
        status: AutomationStatus.ACTIVE,
        $or: [
          { nextExecutionAt: { $gte: timeRange.start, $lte: timeRange.end } },
          { 'config.triggers.schedule.startDate': { $lte: timeRange.end } },
          { 'config.triggers.schedule.endDate': { $gte: timeRange.start } }
        ]
      };

      // Fetch data
      const [scheduledPosts, activeAutomations] = await Promise.all([
        PostModel.find(postQuery).sort({ scheduledAt: 1 }),
        AutomationModel.find(automationQuery).sort({ nextExecutionAt: 1 })
      ]);

      // Process scheduled posts -> calendar events
      const postEvents = scheduledPosts.map(post => ({
        id: String(post._id),
        title: post.content?.text?.substring(0, 50) + (post.content?.text && post.content.text.length > 50 ? '...' : '') || 'Untitled Post',
        content: post.content?.text || '',
        platform: String(post.platform),
        scheduledAt: post.scheduledAt!,
        status: (post.status === 'deleted' ? 'failed' : post.status) as 'scheduled' | 'published' | 'failed' | 'draft',
        type: 'post' as const,
        mediaUrls: (post.content?.media?.map(m => m.url) ?? []),
        tags: post.content?.hashtags || []
      }));

      // Process automations -> calendar events
      const automationEvents = activeAutomations.map((automation: AutomationDocument) => {
        const triggers = automation.config?.triggers || [];
        const scheduleTrigger = triggers.find(t => t.schedule);
        const startDate = scheduleTrigger?.schedule?.startDate || null;
        const endDate = scheduleTrigger?.schedule?.endDate || null;
        const platformFromAction = automation.config?.actions?.[0]?.platform || 'unknown';
        const nextRun = this.calculateNextRun(automation);

        return {
          id: String(automation._id),
          title: automation.name,
          content: automation.description || '',
          platform: platformFromAction,
          scheduledAt: nextRun || startDate || automation.nextExecutionAt || automation.updatedAt,
          status: automation.status === AutomationStatus.ACTIVE ? 'scheduled' : 'draft',
          type: 'automation' as const,
          tags: [] as string[],
          mediaUrls: [] as string[]
        };
      });

      // Combine events
      const events: ContentCalendar['events'] = [...postEvents, ...automationEvents] as ContentCalendar['events'];

      // Build summary
      const now = new Date();
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diffToMonday = (day + 6) % 7; // Monday=0
      startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const summary = {
        totalScheduled: events.filter(e => e.status === 'scheduled').length,
        thisWeek: events.filter(e => e.scheduledAt >= startOfWeek && e.scheduledAt <= endOfWeek).length,
        thisMonth: events.filter(e => e.scheduledAt >= startOfMonth && e.scheduledAt <= endOfMonth).length,
        byPlatform: events.reduce((acc, e) => {
          acc[e.platform] = (acc[e.platform] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byStatus: events.reduce((acc, e) => {
          acc[e.status] = (acc[e.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return {
        events,
        summary
      };

    } catch (error) {
      logger.error('Error getting content calendar:', error);
      throw new Error('Failed to retrieve content calendar');
    }
  }

  /**
   * Calculate calendar statistics
   */
  private calculateCalendarStats(posts: any[], automations: any[], timeRange: TimeRange) {
    const totalPosts = posts.length;
    const totalAutomations = automations.length;
    
    // Count posts by status
    const postsByStatus = posts.reduce((acc, post) => {
      acc[post.status] = (acc[post.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count posts by platform
    const postsByPlatform = posts.reduce((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count automations by platform
    const automationsByPlatform = automations.reduce((acc, automation) => {
      acc[automation.platform] = (acc[automation.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate posting frequency (posts per day)
    const daysDiff = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const postsPerDay = daysDiff > 0 ? totalPosts / daysDiff : 0;

    return {
      totalPosts,
      totalAutomations,
      postsByStatus,
      postsByPlatform,
      automationsByPlatform,
      postsPerDay: Math.round(postsPerDay * 100) / 100 // Round to 2 decimal places
    };
  }

  /**
   * Group events by date
   */
  private groupEventsByDate(events: any[]): Record<string, any[]> {
    return events.reduce((acc, event) => {
      const date = (event.scheduledAt || event.startDate).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {} as Record<string, any[]>);
  }

  /**
   * Calculate next run time for automation
   */
  private calculateNextRun(automation: AutomationDocument): Date | null {
    if (automation.status !== AutomationStatus.ACTIVE) {
      return null;
    }

    // Prefer explicit nextExecutionAt
    if (automation.nextExecutionAt) {
      return automation.nextExecutionAt;
    }

    const triggers = automation.config?.triggers || [];
    const scheduleTrigger = triggers.find(t => t.schedule);
    if (scheduleTrigger?.schedule?.startDate) {
      const now = new Date();
      const start = scheduleTrigger.schedule.startDate;
      if (start > now) return start;
    }

    return null;
  }

  /**
   * Get next daily run time
   */
  private getNextDailyRun(schedule: any, now: Date): Date {
    const nextRun = new Date(now);
    nextRun.setDate(nextRun.getDate() + 1);
    
    // Set time from schedule if available
    if (schedule.time) {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      nextRun.setHours(hours, minutes, 0, 0);
    } else {
      nextRun.setHours(9, 0, 0, 0); // Default to 9 AM
    }

    return nextRun;
  }

  /**
   * Get next weekly run time
   */
  private getNextWeeklyRun(schedule: any, now: Date): Date {
    const nextRun = new Date(now);
    const targetDay = schedule.dayOfWeek || 1; // Default to Monday
    const currentDay = nextRun.getDay();
    
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Next week
    }
    
    nextRun.setDate(nextRun.getDate() + daysToAdd);
    
    // Set time from schedule if available
    if (schedule.time) {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      nextRun.setHours(hours, minutes, 0, 0);
    } else {
      nextRun.setHours(9, 0, 0, 0); // Default to 9 AM
    }

    return nextRun;
  }

  /**
   * Get next monthly run time
   */
  private getNextMonthlyRun(schedule: any, now: Date): Date {
    const nextRun = new Date(now);
    const targetDate = schedule.dayOfMonth || 1; // Default to 1st of month
    
    // If current date is past the target date, move to next month
    if (nextRun.getDate() >= targetDate) {
      nextRun.setMonth(nextRun.getMonth() + 1);
      nextRun.setDate(targetDate);
    } else {
      nextRun.setDate(targetDate);
    }
    
    // If next run is before now (due to time being earlier today), move to next month
    if (nextRun <= now) {
      nextRun.setMonth(nextRun.getMonth() + 1);
      nextRun.setDate(targetDate);
    }
    
    // Set time from schedule if available
    if (schedule.time) {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      nextRun.setHours(hours, minutes, 0, 0);
    } else {
      nextRun.setHours(9, 0, 0, 0); // Default to 9 AM
    }

    return nextRun;
  }

  /**
   * Get upcoming posts for a specific date range
   */
  async getUpcomingPosts(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    days: number = 7,
    platform?: string
  ): Promise<any[]> {
    // Check permissions
    const permissionCheck = await roleService.checkSubscriptionPermission(
      user,
      subscription,
      PERMISSIONS.POST_READ
    );

    if (!permissionCheck.hasPermission) {
      throw new Error(permissionCheck.reason || 'Insufficient permissions');
    }

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const query: any = {
        userId: user._id,
        scheduledAt: { $gte: startDate, $lte: endDate },
        status: 'scheduled'
      };

      if (platform) {
        query.platform = platform;
      }

      const posts = await PostModel.find(query)
        .sort({ scheduledAt: 1 })
        .limit(50);

      return posts.map(post => ({
        id: String(post._id),
        title: post.content?.text?.substring(0, 50) + (post.content?.text && post.content.text.length > 50 ? '...' : '') || 'Untitled Post',
        content: post.content?.text || '',
        platform: post.platform,
        scheduledAt: post.scheduledAt!,
        status: post.status,
        mediaUrls: (post.content?.media?.map(m => m.url) ?? []),
        hashtags: post.content?.hashtags || []
      }));

    } catch (error) {
      logger.error('Error getting upcoming posts:', error);
      throw new Error('Failed to retrieve upcoming posts');
    }
  }

  /**
   * Get calendar events for a specific month
   */
  async getMonthlyCalendar(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    year: number,
    month: number,
    platform?: string
  ): Promise<Record<string, any[]>> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const timeRange: TimeRange = { start: startDate, end: endDate };
    const calendar = await this.getContentCalendar(user, subscription, timeRange, platform);

    return this.groupEventsByDate(calendar.events);
  }

  /**
   * Get posting frequency analysis
   */
  async getPostingFrequency(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    timeRange: TimeRange,
    platform?: string
  ): Promise<{
    daily: Record<string, number>;
    weekly: Record<string, number>;
    monthly: Record<string, number>;
    averagePerDay: number;
    averagePerWeek: number;
    averagePerMonth: number;
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
      const query: any = {
        userId: user._id,
        $or: [
          { publishedAt: { $gte: timeRange.start, $lte: timeRange.end } },
          { scheduledAt: { $gte: timeRange.start, $lte: timeRange.end } }
        ]
      };

      if (platform) {
        query.platform = platform;
      }

      const posts = await PostModel.find(query);

      // Group posts by time periods
      const daily: Record<string, number> = {};
      const weekly: Record<string, number> = {};
      const monthly: Record<string, number> = {};

      posts.forEach(post => {
        const date = post.publishedAt || post.scheduledAt!;
        const dayKey = date.toISOString().split('T')[0];
        const weekKey = this.getWeekKey(date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        daily[dayKey] = (daily[dayKey] || 0) + 1;
        weekly[weekKey] = (weekly[weekKey] || 0) + 1;
        monthly[monthKey] = (monthly[monthKey] || 0) + 1;
      });

      // Calculate averages
      const totalDays = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
      const totalWeeks = Math.ceil(totalDays / 7);
      const totalMonths = Math.ceil(totalDays / 30);

      const averagePerDay = totalDays > 0 ? posts.length / totalDays : 0;
      const averagePerWeek = totalWeeks > 0 ? posts.length / totalWeeks : 0;
      const averagePerMonth = totalMonths > 0 ? posts.length / totalMonths : 0;

      return {
        daily,
        weekly,
        monthly,
        averagePerDay,
        averagePerWeek,
        averagePerMonth
      };
    } catch (error) {
      logger.error('Error getting posting frequency:', error);
      return {
        daily: {},
        weekly: {},
        monthly: {},
        averagePerDay: 0,
        averagePerWeek: 0,
        averagePerMonth: 0
      };
    }
  }

  /**
   * Get week key (YYYY-WW)
   */
  private getWeekKey(date: Date): string {
    const weekNumber = this.getWeekNumber(date);
    return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  }

  /**
   * Get ISO week number
   */
  private getWeekNumber(date: Date): number {
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year
    tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
    // January 4 is always in week 1
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from then
    return 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  }
}

export const dashboardCalendarService = new DashboardCalendarService();