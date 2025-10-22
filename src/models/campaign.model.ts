/**
 * Campaign Model
 * Mongoose model for managing marketing campaigns
 */

import { Schema, model, Types, Document } from 'mongoose';
import { SocialPlatform } from '../types/common.types';

// Campaign Status const object
export const CampaignStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export type CampaignStatusType = typeof CampaignStatus[keyof typeof CampaignStatus];

// Campaign document interface
export interface CampaignDocument extends Document {
  // Basic info
  userId: Types.ObjectId;
  name: string;
  description?: string;
  status: CampaignStatusType;
  
  // Platform targeting
  platforms: SocialPlatform[];
  platformAccounts: Types.ObjectId[];
  
  // Scheduling
  startDate: Date;
  endDate?: Date;
  timezone: string;
  
  // Content
  posts: Types.ObjectId[];
  templates: Types.ObjectId[];
  
  // Analytics
  analytics: {
    totalPosts: number;
    publishedPosts: number;
    scheduledPosts: number;
    failedPosts: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalSaves: number;
    engagementRate: number;
    reach: number;
    impressions: number;
    clickThroughRate: number;
    conversionRate: number;
  };
  
  // Budget and goals
  budget?: {
    total: number;
    spent: number;
    currency: string;
  };
  goals: {
    type: 'awareness' | 'engagement' | 'traffic' | 'conversions' | 'sales';
    target: number;
    current: number;
    unit: string;
  }[];
  
  // Settings
  settings: {
    autoPublish: boolean;
    autoOptimize: boolean;
    notifications: boolean;
    approvalRequired: boolean;
    contentModeration: boolean;
  };
  
  // Collaboration
  collaborators: {
    userId: Types.ObjectId;
    role: 'owner' | 'editor' | 'viewer';
    permissions: string[];
  }[];
  
  // Metadata
  metadata: Record<string, unknown>;
  
  // Soft delete
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Campaign specific methods
  start(): Promise<CampaignDocument>;
  pause(): Promise<CampaignDocument>;
  resume(): Promise<CampaignDocument>;
  complete(): Promise<CampaignDocument>;
  cancel(): Promise<CampaignDocument>;
  updateAnalytics(analytics: Partial<CampaignDocument['analytics']>): Promise<CampaignDocument>;
  addPost(postId: Types.ObjectId): Promise<CampaignDocument>;
  removePost(postId: Types.ObjectId): Promise<CampaignDocument>;
  addCollaborator(userId: Types.ObjectId, role: string, permissions: string[]): Promise<CampaignDocument>;
  removeCollaborator(userId: Types.ObjectId): Promise<CampaignDocument>;
  updateSettings(settings: Partial<CampaignDocument['settings']>): Promise<CampaignDocument>;
  calculateProgress(): number;
  isActive(): boolean;
  isPaused(): boolean;
  isCompleted(): boolean;
  isCancelled(): boolean;
  canEdit(userId: Types.ObjectId): boolean;
  canView(userId: Types.ObjectId): boolean;
  softDelete(): Promise<CampaignDocument>;
  restore(): Promise<CampaignDocument>;
  toPublicJSON(): Record<string, unknown>;
}

// Campaign schema definition
const campaignSchema = new Schema({
  // Basic info
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: Object.values(CampaignStatus),
    default: CampaignStatus.DRAFT,
    index: true
  },
  
  // Platform targeting
  platforms: [{
    type: String,
    enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok']
  }],
  platformAccounts: [{
    type: Schema.Types.ObjectId,
    ref: 'PlatformAccount'
  }],
  
  // Scheduling
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    index: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Content
  posts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  templates: [{
    type: Schema.Types.ObjectId,
    ref: 'Template'
  }],
  
  // Analytics
  analytics: {
    totalPosts: {
      type: Number,
      default: 0
    },
    publishedPosts: {
      type: Number,
      default: 0
    },
    scheduledPosts: {
      type: Number,
      default: 0
    },
    failedPosts: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    totalComments: {
      type: Number,
      default: 0
    },
    totalShares: {
      type: Number,
      default: 0
    },
    totalSaves: {
      type: Number,
      default: 0
    },
    engagementRate: {
      type: Number,
      min: 0,
      max: 100,
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
    clickThroughRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    conversionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  
  // Budget and goals
  budget: {
    total: {
      type: Number,
      min: 0
    },
    spent: {
      type: Number,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  goals: [{
    type: {
      type: String,
      enum: ['awareness', 'engagement', 'traffic', 'conversions', 'sales'],
      required: true
    },
    target: {
      type: Number,
      required: true,
      min: 0
    },
    current: {
      type: Number,
      default: 0,
      min: 0
    },
    unit: {
      type: String,
      required: true
    }
  }],
  
  // Settings
  settings: {
    autoPublish: {
      type: Boolean,
      default: false
    },
    autoOptimize: {
      type: Boolean,
      default: false
    },
    notifications: {
      type: Boolean,
      default: true
    },
    approvalRequired: {
      type: Boolean,
      default: false
    },
    contentModeration: {
      type: Boolean,
      default: true
    }
  },
  
  // Collaboration
  collaborators: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      required: true
    },
    permissions: [{
      type: String
    }]
  }],
  
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
  },


  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'campaigns'
});

// Instance methods
campaignSchema.methods.start = async function(this: CampaignDocument): Promise<CampaignDocument> {
  this.status = CampaignStatus.ACTIVE;
  return this.save();
};

campaignSchema.methods.pause = async function(this: CampaignDocument): Promise<CampaignDocument> {
  this.status = CampaignStatus.PAUSED;
  return this.save();
};

campaignSchema.methods.resume = async function(this: CampaignDocument): Promise<CampaignDocument> {
  this.status = CampaignStatus.ACTIVE;
  return this.save();
};

campaignSchema.methods.complete = async function(this: CampaignDocument): Promise<CampaignDocument> {
  this.status = CampaignStatus.COMPLETED;
  return this.save();
};

campaignSchema.methods.cancel = async function(this: CampaignDocument): Promise<CampaignDocument> {
  this.status = CampaignStatus.CANCELLED;
  return this.save();
};

campaignSchema.methods.updateAnalytics = async function(this: CampaignDocument, analytics: Partial<CampaignDocument['analytics']>): Promise<CampaignDocument> {
  this.analytics = { ...this.analytics, ...analytics };
  return this.save();
};

campaignSchema.methods.addPost = async function(this: CampaignDocument, postId: Types.ObjectId): Promise<CampaignDocument> {
  if (!this.posts.includes(postId)) {
    this.posts.push(postId);
    this.analytics.totalPosts += 1;
  }
  return this.save();
};

campaignSchema.methods.removePost = async function(this: CampaignDocument, postId: Types.ObjectId): Promise<CampaignDocument> {
  const index = this.posts.indexOf(postId);
  if (index > -1) {
    this.posts.splice(index, 1);
    this.analytics.totalPosts = Math.max(0, this.analytics.totalPosts - 1);
  }
  return this.save();
};

campaignSchema.methods.addCollaborator = async function(this: CampaignDocument, userId: Types.ObjectId, role: string, permissions: string[]): Promise<CampaignDocument> {
  const existingIndex = this.collaborators.findIndex(c => c.userId.equals(userId));
  
  if (existingIndex > -1) {
    this.collaborators[existingIndex].role = role as 'owner' | 'editor' | 'viewer';
    this.collaborators[existingIndex].permissions = permissions;
  } else {
    this.collaborators.push({
      userId,
      role: role as 'owner' | 'editor' | 'viewer',
      permissions
    });
  }
  
  return this.save();
};

campaignSchema.methods.removeCollaborator = async function(this: CampaignDocument, userId: Types.ObjectId): Promise<CampaignDocument> {
  this.collaborators = this.collaborators.filter(c => !c.userId.equals(userId));
  return this.save();
};

campaignSchema.methods.updateSettings = async function(this: CampaignDocument, settings: Partial<CampaignDocument['settings']>): Promise<CampaignDocument> {
  this.settings = { ...this.settings, ...settings };
  return this.save();
};

campaignSchema.methods.calculateProgress = function(this: CampaignDocument): number {
  if (this.goals.length === 0) return 0;
  
  const totalProgress = this.goals.reduce((sum, goal) => {
    const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
    return sum + Math.min(progress, 100);
  }, 0);
  
  return totalProgress / this.goals.length;
};

campaignSchema.methods.isActive = function(this: CampaignDocument): boolean {
  return this.status === CampaignStatus.ACTIVE;
};

campaignSchema.methods.isPaused = function(this: CampaignDocument): boolean {
  return this.status === CampaignStatus.PAUSED;
};

campaignSchema.methods.isCompleted = function(this: CampaignDocument): boolean {
  return this.status === CampaignStatus.COMPLETED;
};

campaignSchema.methods.isCancelled = function(this: CampaignDocument): boolean {
  return this.status === CampaignStatus.CANCELLED;
};

campaignSchema.methods.canEdit = function(this: CampaignDocument, userId: Types.ObjectId): boolean {
  if (this.userId.equals(userId)) return true;
  
  const collaborator = this.collaborators.find(c => c.userId.equals(userId));
  return collaborator ? ['owner', 'editor'].includes(collaborator.role) : false;
};

campaignSchema.methods.canView = function(this: CampaignDocument, userId: Types.ObjectId): boolean {
  if (this.userId.equals(userId)) return true;
  
  const collaborator = this.collaborators.find(c => c.userId.equals(userId));
  return collaborator ? ['owner', 'editor', 'viewer'].includes(collaborator.role) : false;
};

campaignSchema.methods.softDelete = async function(this: CampaignDocument): Promise<CampaignDocument> {
  this.deletedAt = new Date();
  this.status = CampaignStatus.CANCELLED;
  return this.save();
};

campaignSchema.methods.restore = async function(this: CampaignDocument): Promise<CampaignDocument> {
  this.deletedAt = undefined;
  this.status = CampaignStatus.DRAFT;
  return this.save();
};

campaignSchema.methods.toPublicJSON = function(this: CampaignDocument): Record<string, unknown> {
  const obj: Record<string, unknown> = { ...this.toObject() };
  delete obj.__v;
  return obj;
};

// Static methods
campaignSchema.statics.findByUserId = function(userId: string | Types.ObjectId) {
  return this.find({ userId, deletedAt: null });
};

campaignSchema.statics.findByStatus = function(status: CampaignStatusType) {
  return this.find({ status, deletedAt: null });
};

campaignSchema.statics.findActiveCampaigns = function() {
  return this.find({ status: CampaignStatus.ACTIVE, deletedAt: null });
};

campaignSchema.statics.findByPlatform = function(platform: SocialPlatform) {
  return this.find({ platforms: platform, deletedAt: null });
};

campaignSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
    ],
    deletedAt: null
  });
};

campaignSchema.statics.findByCollaborator = function(userId: string | Types.ObjectId) {
  return this.find({
    $or: [
      { userId },
      { 'collaborators.userId': userId }
    ],
    deletedAt: null
  });
};

// Add indexes
campaignSchema.index({ userId: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ startDate: 1 });
campaignSchema.index({ endDate: 1 });
campaignSchema.index({ platforms: 1 });
campaignSchema.index({ 'collaborators.userId': 1 });
campaignSchema.index({ createdAt: 1 });
campaignSchema.index({ deletedAt: 1 });
campaignSchema.index({ userId: 1, status: 1 });
campaignSchema.index({ status: 1, startDate: 1 });

// Create and export model
export const CampaignModel = model<CampaignDocument>('Campaign', campaignSchema);