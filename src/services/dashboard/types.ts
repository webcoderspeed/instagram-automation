/**
 * Dashboard Service Types
 * Contains all interfaces and types used by dashboard services
 */

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

export interface UserActivitySummary {
  lastLogin: Date | null;
  totalSessions: number;
  averageSessionDuration: number;
  mostActiveHour: number;
  recentActions: Array<{
    action: string;
    timestamp: Date;
    details: string;
  }>;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface DashboardPermissions {
  hasPermission: boolean;
  reason?: string;
}