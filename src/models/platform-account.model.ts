/**
 * Platform Account Model
 * Mongoose model for managing social media platform connections
 */

import { Schema, model, Types, Document } from 'mongoose';
import { SocialPlatform } from '../types/common.types';
// Platform Account Status const object
export const PlatformAccountStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  EXPIRED: 'expired',
  ERROR: 'error'
} as const;

export type PlatformAccountStatusType = typeof PlatformAccountStatus[keyof typeof PlatformAccountStatus];

// Platform Account document interface
export interface PlatformAccountDocument extends Document {
  // Basic info
  userId: Types.ObjectId;
  platform: SocialPlatform;
  platformId: string;
  platformUsername: string;
  displayName?: string;
  profilePicture?: string;
  
  // Authentication
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes: string[];
  
  // Account status
  status: PlatformAccountStatusType;
  isActive: boolean;
  lastSyncAt?: Date;
  lastErrorAt?: Date;
  lastError?: string;
  
  // Platform-specific data
  platformData: Record<string, unknown>;
  
  // Permissions and capabilities
  permissions: string[];
  capabilities: string[];
  
  // Statistics
  stats: {
    totalPosts: number;
    totalFollowers: number;
    totalFollowing: number;
    lastPostAt?: Date;
    engagementRate?: number;
  };
  
  // Settings
  settings: {
    autoPost: boolean;
    autoReply: boolean;
    notifications: boolean;
    timezone?: string;
  };
  
  // Metadata
  metadata: Record<string, unknown>;
  
  // Soft delete
  deletedAt?: Date;
  
  // Platform Account specific methods
  refreshAccessToken(): Promise<PlatformAccountDocument>;
  updateStats(stats: Partial<PlatformAccountDocument['stats']>): Promise<PlatformAccountDocument>;
  updateSettings(settings: Partial<PlatformAccountDocument['settings']>): Promise<PlatformAccountDocument>;
  markError(error: string): Promise<PlatformAccountDocument>;
  clearError(): Promise<PlatformAccountDocument>;
  isTokenExpired(): boolean;
  hasPermission(permission: string): boolean;
  hasCapability(capability: string): boolean;
  softDelete(): Promise<PlatformAccountDocument>;
  restore(): Promise<PlatformAccountDocument>;
  toPublicJSON(): Record<string, unknown>;
}

// Platform Account schema definition
const platformAccountSchema = new Schema({
  // Basic info
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok'],
    required: true
  },
  platformId: {
    type: String,
    required: true
  },
  platformUsername: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String,
    trim: true
  },
  
  // Authentication
  accessToken: {
    type: String,
    required: true,
    select: false // Don't include in queries by default
  },
  refreshToken: {
    type: String,
    select: false
  },
  tokenExpiresAt: {
    type: Date
  },
  scopes: [{
    type: String,
    trim: true
  }],
  
  // Account status
  status: {
    type: String,
    enum: Object.values(PlatformAccountStatus),
    default: PlatformAccountStatus.ACTIVE
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSyncAt: {
    type: Date
  },
  lastErrorAt: Date,
  lastError: String,
  
  // Platform-specific data
  platformData: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Permissions and capabilities
  permissions: [{
    type: String,
    trim: true
  }],
  capabilities: [{
    type: String,
    trim: true
  }],
  
  // Statistics
  stats: {
    totalPosts: {
      type: Number,
      default: 0
    },
    totalFollowers: {
      type: Number,
      default: 0
    },
    totalFollowing: {
      type: Number,
      default: 0
    },
    lastPostAt: Date,
    engagementRate: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  
  // Settings
  settings: {
    autoPost: {
      type: Boolean,
      default: false
    },
    autoReply: {
      type: Boolean,
      default: false
    },
    notifications: {
      type: Boolean,
      default: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Metadata
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Soft delete
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'platform_accounts'
});

// Instance methods
platformAccountSchema.methods.refreshAccessToken = async function(this: PlatformAccountDocument): Promise<PlatformAccountDocument> {
  // This would integrate with platform-specific OAuth refresh logic
  // For now, just update the timestamp
  this.lastSyncAt = new Date();
  return this.save();
};

platformAccountSchema.methods.updateStats = async function(this: PlatformAccountDocument, stats: Partial<PlatformAccountDocument['stats']>): Promise<PlatformAccountDocument> {
  this.stats = { ...this.stats, ...stats };
  this.lastSyncAt = new Date();
  return this.save();
};

platformAccountSchema.methods.updateSettings = async function(this: PlatformAccountDocument, settings: Partial<PlatformAccountDocument['settings']>): Promise<PlatformAccountDocument> {
  this.settings = { ...this.settings, ...settings };
  return this.save();
};

platformAccountSchema.methods.markError = async function(this: PlatformAccountDocument, error: string): Promise<PlatformAccountDocument> {
  this.lastError = error;
  this.lastErrorAt = new Date();
  this.status = PlatformAccountStatus.ERROR;
  return this.save();
};

platformAccountSchema.methods.clearError = async function(this: PlatformAccountDocument): Promise<PlatformAccountDocument> {
  this.lastError = undefined;
  this.lastErrorAt = undefined;
  this.status = PlatformAccountStatus.ACTIVE;
  return this.save();
};

platformAccountSchema.methods.isTokenExpired = function(this: PlatformAccountDocument): boolean {
  return this.tokenExpiresAt ? this.tokenExpiresAt <= new Date() : false;
};

platformAccountSchema.methods.hasPermission = function(this: PlatformAccountDocument, permission: string): boolean {
  return this.permissions.includes(permission);
};

platformAccountSchema.methods.hasCapability = function(this: PlatformAccountDocument, capability: string): boolean {
  return this.capabilities.includes(capability);
};

platformAccountSchema.methods.softDelete = async function(this: PlatformAccountDocument): Promise<PlatformAccountDocument> {
  this.deletedAt = new Date();
  this.isActive = false;
  return this.save();
};

platformAccountSchema.methods.restore = async function(this: PlatformAccountDocument): Promise<PlatformAccountDocument> {
  this.deletedAt = undefined;
  this.isActive = true;
  return this.save();
};

platformAccountSchema.methods.toPublicJSON = function(this: PlatformAccountDocument): Record<string, unknown> {
  const obj: Record<string, unknown> = { ...this.toObject() };
  delete obj.accessToken;
  delete obj.refreshToken;
  delete obj.__v;
  return obj;
};

// Static methods
platformAccountSchema.statics.findByUserId = function(userId: string | Types.ObjectId) {
  return this.find({ userId, deletedAt: null });
};

platformAccountSchema.statics.findByUserAndPlatform = function(userId: string | Types.ObjectId, platform: SocialPlatform) {
  return this.findOne({ userId, platform, deletedAt: null });
};

platformAccountSchema.statics.findByPlatformId = function(platform: SocialPlatform, platformId: string) {
  return this.findOne({ platform, platformId, deletedAt: null });
};

platformAccountSchema.statics.findActiveAccounts = function() {
  return this.find({ isActive: true, status: PlatformAccountStatus.ACTIVE, deletedAt: null });
};

platformAccountSchema.statics.findExpiredTokens = function() {
  return this.find({
    tokenExpiresAt: { $lte: new Date() },
    refreshToken: { $exists: true, $ne: null },
    deletedAt: null
  });
};

platformAccountSchema.statics.findByPlatform = function(platform: SocialPlatform) {
  return this.find({ platform, deletedAt: null });
};



// Create and export model
export const PlatformAccountModel = model<PlatformAccountDocument>('PlatformAccount', platformAccountSchema);