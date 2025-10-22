/**
 * Analytics Model
 * Mongoose model for tracking platform performance metrics and user engagement data
 */

import { Schema, model, Types, Document } from 'mongoose';

// Metric Type
export const MetricType = {
  ENGAGEMENT: 'engagement',
  REACH: 'reach',
  IMPRESSIONS: 'impressions',
  FOLLOWERS: 'followers',
  LIKES: 'likes',
  COMMENTS: 'comments',
  SHARES: 'shares',
  SAVES: 'saves',
  CLICKS: 'clicks',
  VIEWS: 'views',
  STORY_VIEWS: 'story_views',
  PROFILE_VISITS: 'profile_visits'
} as const;

export type MetricTypeType = typeof MetricType[keyof typeof MetricType];

// Time Period
export const TimePeriod = {
  HOURLY: 'hourly',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
} as const;

export type TimePeriodType = typeof TimePeriod[keyof typeof TimePeriod];

// Platform Type
export const PlatformType = {
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
  LINKEDIN: 'linkedin',
  TIKTOK: 'tiktok',
  YOUTUBE: 'youtube'
} as const;

export type PlatformTypeType = typeof PlatformType[keyof typeof PlatformType];

// Analytics document interface
export interface AnalyticsDocument extends Document {
  // Basic Info
  userId: Types.ObjectId;
  platformAccountId: Types.ObjectId;
  platform: PlatformTypeType;
  
  // Metric Info
  metricType: MetricTypeType;
  value: number;
  previousValue?: number;
  changePercent?: number;
  
  // Time Info
  period: TimePeriodType;
  date: Date;
  timestamp: Date;
  
  // Content Reference
  postId?: Types.ObjectId;
  contentId?: string; // Platform-specific content ID
  contentType?: string; // post, story, reel, etc.
  
  // Demographic Data
  demographics?: {
    ageGroups: Record<string, number>;
    genders: Record<string, number>;
    locations: Record<string, number>;
    interests: Record<string, number>;
  };
  
  // Additional Metrics
  additionalMetrics?: Record<string, number>;
  
  // Metadata
  metadata: Record<string, unknown>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  calculateChange(): number;
  getGrowthRate(): number;
}

const analyticsSchema = new Schema({
  // Basic Info
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  platformAccountId: {
    type: Schema.Types.ObjectId,
    ref: 'PlatformAccount',
    required: true,
    index: true
  },
  platform: {
    type: String,
    enum: Object.values(PlatformType),
    required: true,
    index: true
  },
  
  // Metric Info
  metricType: {
    type: String,
    enum: Object.values(MetricType),
    required: true,
    index: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  previousValue: {
    type: Number,
    min: 0
  },
  changePercent: {
    type: Number
  },
  
  // Time Info
  period: {
    type: String,
    enum: Object.values(TimePeriod),
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Content Reference
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    index: true
  },
  contentId: {
    type: String,
    index: true
  },
  contentType: {
    type: String,
    enum: ['post', 'story', 'reel', 'video', 'carousel', 'live'],
    index: true
  },
  
  // Demographic Data
  demographics: {
    ageGroups: {
      type: Map,
      of: Number,
      default: new Map()
    },
    genders: {
      type: Map,
      of: Number,
      default: new Map()
    },
    locations: {
      type: Map,
      of: Number,
      default: new Map()
    },
    interests: {
      type: Map,
      of: Number,
      default: new Map()
    }
  },
  
  // Additional Metrics
  additionalMetrics: {
    type: Map,
    of: Number,
    default: new Map()
  },
  
  // Metadata
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'analytics'
});

// Methods
analyticsSchema.methods.calculateChange = function(this: AnalyticsDocument): number {
  if (!this.previousValue || this.previousValue === 0) {
    return 0;
  }
  
  const change = ((this.value - this.previousValue) / this.previousValue) * 100;
  this.changePercent = Math.round(change * 100) / 100;
  return this.changePercent;
};

analyticsSchema.methods.getGrowthRate = function(this: AnalyticsDocument): number {
  return this.calculateChange();
};

// Indexes
analyticsSchema.index({ userId: 1, platform: 1, metricType: 1, date: 1 });
analyticsSchema.index({ platformAccountId: 1, metricType: 1, date: 1 });
analyticsSchema.index({ userId: 1, date: 1 });
analyticsSchema.index({ platform: 1, metricType: 1, period: 1 });
analyticsSchema.index({ postId: 1, metricType: 1 });
analyticsSchema.index({ contentId: 1, platform: 1 });
analyticsSchema.index({ timestamp: 1 });
analyticsSchema.index({ date: 1, period: 1 });

// Compound indexes for common queries
analyticsSchema.index({ 
  userId: 1, 
  platform: 1, 
  metricType: 1, 
  period: 1, 
  date: -1 
});

export const AnalyticsModel = model<AnalyticsDocument>('Analytics', analyticsSchema);