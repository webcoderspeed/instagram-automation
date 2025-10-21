/**
 * Post Model
 * Mongoose model for managing social media posts
 */

import { Schema, model, Types, Document } from 'mongoose';
import { SocialPlatform, MediaFile } from '../types/common.types';

// Post Status const object
export const PostStatus = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  FAILED: 'failed',
  DELETED: 'deleted'
} as const;

export type PostStatusType = typeof PostStatus[keyof typeof PostStatus];

// Content Type const object
export const ContentType = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  CAROUSEL: 'carousel',
  STORY: 'story',
  REEL: 'reel',
  LIVE: 'live'
} as const;

export type ContentTypeType = typeof ContentType[keyof typeof ContentType];

// Post document interface
export interface PostDocument extends Document {
  // Basic info
  userId: Types.ObjectId;
  platformAccountId: Types.ObjectId;
  platform: SocialPlatform;
  
  // Content
  content: {
    text?: string;
    media?: MediaFile[];
    hashtags?: string[];
    mentions?: string[];
    location?: {
      name: string;
      latitude?: number;
      longitude?: number;
      address?: string;
      city?: string;
      country?: string;
      platformLocationId?: string;
    };
  };
  
  // Post details
  type: ContentTypeType;
  status: PostStatusType;
  scheduledAt?: Date;
  publishedAt?: Date;
  platformPostId?: string;
  platformData: Record<string, unknown>;
  
  // Analytics
  analytics: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    reach?: number;
    impressions?: number;
    engagementRate?: number;
    clickThroughRate?: number;
  };
  
  // Campaign and automation
  campaignId?: Types.ObjectId;
  automationId?: Types.ObjectId;
  templateId?: Types.ObjectId;
  
  // Error handling
  lastError?: string;
  lastErrorAt?: Date;
  retryCount: number;
  maxRetries: number;
  
  // Metadata
  metadata: Record<string, unknown>;
  
  // Soft delete
  deletedAt?: Date;
  
  // Post specific methods
  publish(): Promise<PostDocument>;
  schedule(scheduledAt: Date): Promise<PostDocument>;
  cancel(): Promise<PostDocument>;
  updateAnalytics(analytics: Partial<PostDocument['analytics']>): Promise<PostDocument>;
  markError(error: string): Promise<PostDocument>;
  clearError(): Promise<PostDocument>;
  retry(): Promise<PostDocument>;
  softDelete(): Promise<PostDocument>;
  restore(): Promise<PostDocument>;
  toPublicJSON(): Record<string, unknown>;
  canRetry(): boolean;
  isScheduled(): boolean;
  isPublished(): boolean;
  isDraft(): boolean;
  isFailed(): boolean;
}

// Post schema definition
const postSchema = new Schema({
  // Basic info
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
    enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok'],
    required: true,
    index: true
  },
  
  // Content
  content: {
    text: {
      type: String,
      trim: true
    },
    media: [{
      id: String,
      url: String,
      type: {
        type: String,
        enum: ['image', 'video', 'audio', 'document']
      },
      mimeType: String,
      size: Number,
      filename: String,
      alt: String,
      caption: String
    }],
    hashtags: [{
      type: String,
      trim: true
    }],
    mentions: [{
      type: String,
      trim: true
    }],
    location: {
      name: String,
      latitude: Number,
      longitude: Number,
      address: String,
      city: String,
      country: String,
      platformLocationId: String
    }
  },
  
  // Post details
  type: {
    type: String,
    enum: Object.values(ContentType),
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: Object.values(PostStatus),
    default: PostStatus.DRAFT,
    index: true
  },
  scheduledAt: {
    type: Date,
    index: true
  },
  publishedAt: {
    type: Date,
    index: true
  },
  platformPostId: {
    type: String,
    index: true
  },
  platformData: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Analytics
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    saves: {
      type: Number,
      default: 0
    },
    reach: {
      type: Number,
      default: 0
    },
    impressions: {
      type: Number,
      default: 0
    },
    engagementRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    clickThroughRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  
  // Campaign and automation
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
    index: true
  },
  automationId: {
    type: Schema.Types.ObjectId,
    ref: 'Automation',
    index: true
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'Template',
    index: true
  },
  
  // Error handling
  lastError: String,
  lastErrorAt: Date,
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  
  // Metadata
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Soft delete
  deletedAt: {
    type: Date,
    default: null,
    index: true
  }
}, {
  timestamps: true,
  collection: 'posts'
});

// Instance methods
postSchema.methods.publish = async function(this: PostDocument): Promise<PostDocument> {
  this.status = PostStatus.PUBLISHED;
  this.publishedAt = new Date();
  this.scheduledAt = undefined;
  return this.save();
};

postSchema.methods.schedule = async function(this: PostDocument, scheduledAt: Date): Promise<PostDocument> {
  this.status = PostStatus.SCHEDULED;
  this.scheduledAt = scheduledAt;
  this.publishedAt = undefined;
  return this.save();
};

postSchema.methods.cancel = async function(this: PostDocument): Promise<PostDocument> {
  this.status = PostStatus.DRAFT;
  this.scheduledAt = undefined;
  this.publishedAt = undefined;
  return this.save();
};

postSchema.methods.updateAnalytics = async function(this: PostDocument, analytics: Partial<PostDocument['analytics']>): Promise<PostDocument> {
  this.analytics = { ...this.analytics, ...analytics };
  return this.save();
};

postSchema.methods.markError = async function(this: PostDocument, error: string): Promise<PostDocument> {
  this.lastError = error;
  this.lastErrorAt = new Date();
  this.status = PostStatus.FAILED;
  this.retryCount += 1;
  return this.save();
};

postSchema.methods.clearError = async function(this: PostDocument): Promise<PostDocument> {
  this.lastError = undefined;
  this.lastErrorAt = undefined;
  this.retryCount = 0;
  return this.save();
};

postSchema.methods.retry = async function(this: PostDocument): Promise<PostDocument> {
  if (!this.canRetry()) {
    throw new Error('Maximum retry attempts exceeded');
  }
  this.status = PostStatus.SCHEDULED;
  this.lastError = undefined;
  this.lastErrorAt = undefined;
  return this.save();
};

postSchema.methods.softDelete = async function(this: PostDocument): Promise<PostDocument> {
  this.deletedAt = new Date();
  this.status = PostStatus.DELETED;
  return this.save();
};

postSchema.methods.restore = async function(this: PostDocument): Promise<PostDocument> {
  this.deletedAt = undefined;
  this.status = PostStatus.DRAFT;
  return this.save();
};

postSchema.methods.toPublicJSON = function(this: PostDocument): Record<string, unknown> {
  const obj: Record<string, unknown> = { ...this.toObject() };
  delete obj.__v;
  return obj;
};

postSchema.methods.canRetry = function(this: PostDocument): boolean {
  return this.retryCount < this.maxRetries;
};

postSchema.methods.isScheduled = function(this: PostDocument): boolean {
  return this.status === PostStatus.SCHEDULED;
};

postSchema.methods.isPublished = function(this: PostDocument): boolean {
  return this.status === PostStatus.PUBLISHED;
};

postSchema.methods.isDraft = function(this: PostDocument): boolean {
  return this.status === PostStatus.DRAFT;
};

postSchema.methods.isFailed = function(this: PostDocument): boolean {
  return this.status === PostStatus.FAILED;
};

// Static methods
postSchema.statics.findByUserId = function(userId: string | Types.ObjectId) {
  return this.find({ userId, deletedAt: null });
};

postSchema.statics.findByPlatformAccount = function(platformAccountId: string | Types.ObjectId) {
  return this.find({ platformAccountId, deletedAt: null });
};

postSchema.statics.findByStatus = function(status: PostStatusType) {
  return this.find({ status, deletedAt: null });
};

postSchema.statics.findScheduledPosts = function(before?: Date) {
  const query: Record<string, unknown> = {
    status: PostStatus.SCHEDULED,
    deletedAt: null
  };
  
  if (before) {
    query.scheduledAt = { $lte: before };
  }
  
  return this.find(query).sort({ scheduledAt: 1 });
};

postSchema.statics.findFailedPosts = function() {
  return this.find({
    status: PostStatus.FAILED,
    retryCount: { $lt: this.schema.paths.maxRetries.default },
    deletedAt: null
  });
};

postSchema.statics.findByCampaign = function(campaignId: string | Types.ObjectId) {
  return this.find({ campaignId, deletedAt: null });
};

postSchema.statics.findByAutomation = function(automationId: string | Types.ObjectId) {
  return this.find({ automationId, deletedAt: null });
};

postSchema.statics.findByPlatform = function(platform: SocialPlatform) {
  return this.find({ platform, deletedAt: null });
};

// Add indexes
postSchema.index({ userId: 1 });
postSchema.index({ platformAccountId: 1 });
postSchema.index({ platform: 1 });
postSchema.index({ status: 1 });
postSchema.index({ scheduledAt: 1 });
postSchema.index({ publishedAt: 1 });
postSchema.index({ campaignId: 1 });
postSchema.index({ automationId: 1 });
postSchema.index({ templateId: 1 });
postSchema.index({ platformPostId: 1 });
postSchema.index({ type: 1 });
postSchema.index({ createdAt: 1 });
postSchema.index({ deletedAt: 1 });
postSchema.index({ userId: 1, status: 1 });
postSchema.index({ platformAccountId: 1, status: 1 });
postSchema.index({ status: 1, scheduledAt: 1 });

// Create and export model
export const PostModel = model<PostDocument>('Post', postSchema);