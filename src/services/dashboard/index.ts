/**
 * Dashboard Services Index
 * Barrel exports for all dashboard-related services
 */

// Export all types
export * from './types';

// Type-only imports for public method signatures
import type { UserDocument } from '../../models/user.model';
import type { SubscriptionDocument } from '../../models/subscription.model';
import type { PlatformTypeType } from '../../models/analytics.model';
import type { DashboardStats, AnalyticsData, ContentCalendar, TimeRange, UserActivitySummary } from './types';

// Public interfaces for each service to avoid exporting private members
export interface DashboardStatsServicePublic {
  getDashboardStats(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    timeRange?: TimeRange
  ): Promise<DashboardStats>;
}

export interface DashboardAnalyticsServicePublic {
  getAnalyticsData(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    timeRange: TimeRange,
    platforms?: PlatformTypeType[]
  ): Promise<AnalyticsData>;
  getPlatformSummary(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    platform: PlatformTypeType,
    timeRange: TimeRange
  ): Promise<any>;
  getRealTimeAnalytics(
    user: UserDocument,
    subscription: SubscriptionDocument | null
  ): Promise<any>;
}

export interface DashboardCalendarServicePublic {
  getContentCalendar(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    timeRange: TimeRange,
    platform?: string
  ): Promise<ContentCalendar>;
  getUpcomingPosts(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    days?: number,
    platform?: string
  ): Promise<any[]>;
  getMonthlyCalendar(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    year: number,
    month: number,
    platform?: string
  ): Promise<Record<string, any[]>>;
  getPostingFrequency(
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
  }>;
}

export interface DashboardActivityServicePublic {
  getUserActivitySummary(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    timeRange: TimeRange
  ): Promise<UserActivitySummary>;
  getRecentPosts(user: UserDocument, timeRange: TimeRange): Promise<any[]>;
  getRecentAutomations(user: UserDocument, timeRange: TimeRange): Promise<any[]>;
  getRecentActivityFeed(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    limit?: number
  ): Promise<any[]>;
  getUserEngagementSummary(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    timeRange: TimeRange
  ): Promise<{
    totalEngagement: number;
    averageEngagementRate: number;
    topPerformingPosts: any[];
    platformBreakdown: Record<string, number>;
  }>;
}

export type DashboardServices = {
  stats: DashboardStatsServicePublic;
  analytics: DashboardAnalyticsServicePublic;
  calendar: DashboardCalendarServicePublic;
  activity: DashboardActivityServicePublic;
};

// Import services
import { dashboardStatsService } from './stats.service';
import { dashboardAnalyticsService } from './analytics.service';
import { dashboardCalendarService } from './calendar.service';
import { dashboardActivityService } from './activity.service';

// Export services
export { dashboardStatsService } from './stats.service';
export { dashboardAnalyticsService } from './analytics.service';
export { dashboardCalendarService } from './calendar.service';
export { dashboardActivityService } from './activity.service';

// Export a combined dashboard service object for convenience
export const dashboardServices: DashboardServices = {
  stats: dashboardStatsService,
  analytics: dashboardAnalyticsService,
  calendar: dashboardCalendarService,
  activity: dashboardActivityService
};

// Export default as the combined services object
export default dashboardServices;