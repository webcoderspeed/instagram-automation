/**
 * Login History Model
 * Tracks detailed login sessions for analytics and security monitoring
 */

import { Schema, model, Types, Document, Model } from 'mongoose';

export interface LoginHistoryDocument extends Document {
  userId: Types.ObjectId;
  
  // Login details
  loginAt: Date;
  logoutAt?: Date;
  sessionDuration?: number; // in minutes
  
  // Device & Browser info
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  browser: string;
  os: string;
  device: string; // Mobile, Desktop, Tablet
  
  // Location info
  location?: string;
  country?: string;
  city?: string;
  timezone?: string;
  
  // Security flags
  isSuspicious: boolean;
  suspiciousReasons: string[];
  isNewDevice: boolean;
  isNewLocation: boolean;
  
  // Session info
  rememberMe: boolean;
  sessionId?: string;
  
  // Status
  status: 'active' | 'expired' | 'logged_out' | 'force_logout';
  
  // Metadata
  metadata: Record<string, unknown>;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  markLoggedOut(): Promise<LoginHistoryDocument>;
  markExpired(): Promise<LoginHistoryDocument>;
}

export interface LoginHistoryModel extends Model<LoginHistoryDocument> {
  getLoginStats(userId: Types.ObjectId, days?: number): Promise<any>;
}

const loginHistorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Login details
    loginAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    logoutAt: {
      type: Date,
    },
    sessionDuration: {
      type: Number, // in minutes
    },
    
    // Device & Browser info
    ipAddress: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    userAgent: {
      type: String,
      required: true,
      trim: true,
    },
    deviceFingerprint: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    browser: {
      type: String,
      trim: true,
    },
    os: {
      type: String,
      trim: true,
    },
    device: {
      type: String,
      enum: ['Mobile', 'Desktop', 'Tablet', 'Unknown'],
      default: 'Unknown',
    },
    
    // Location info
    location: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    timezone: {
      type: String,
      trim: true,
    },
    
    // Security flags
    isSuspicious: {
      type: Boolean,
      default: false,
      index: true,
    },
    suspiciousReasons: [{
      type: String,
      trim: true,
    }],
    isNewDevice: {
      type: Boolean,
      default: false,
    },
    isNewLocation: {
      type: Boolean,
      default: false,
    },
    
    // Session info
    rememberMe: {
      type: Boolean,
      default: false,
    },
    sessionId: {
      type: String,
      trim: true,
    },
    
    // Status
    status: {
      type: String,
      enum: ['active', 'expired', 'logged_out', 'force_logout'],
      default: 'active',
      index: true,
    },
    
    // Metadata
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'login_history',
  }
);

// Indexes for better query performance
loginHistorySchema.index({ userId: 1, loginAt: -1 });
loginHistorySchema.index({ ipAddress: 1, loginAt: -1 });
loginHistorySchema.index({ deviceFingerprint: 1, loginAt: -1 });
loginHistorySchema.index({ isSuspicious: 1, loginAt: -1 });
loginHistorySchema.index({ status: 1, loginAt: -1 });

// Methods
loginHistorySchema.methods.markLoggedOut = async function (
  this: LoginHistoryDocument
): Promise<LoginHistoryDocument> {
  this.logoutAt = new Date();
  this.status = 'logged_out';
  
  if (this.loginAt) {
    const duration = Math.floor((this.logoutAt.getTime() - this.loginAt.getTime()) / (1000 * 60));
    this.sessionDuration = duration;
  }
  
  return this.save();
};

loginHistorySchema.methods.markExpired = async function (
  this: LoginHistoryDocument
): Promise<LoginHistoryDocument> {
  this.status = 'expired';
  if (!this.logoutAt) {
    this.logoutAt = new Date();
    
    if (this.loginAt) {
      const duration = Math.floor((this.logoutAt.getTime() - this.loginAt.getTime()) / (1000 * 60));
      this.sessionDuration = duration;
    }
  }
  
  return this.save();
};

// Static methods for analytics
loginHistorySchema.statics.getLoginStats = async function (
  userId: Types.ObjectId,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await this.aggregate([
    {
      $match: {
        userId,
        loginAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        totalLogins: { $sum: 1 },
        uniqueDevices: { $addToSet: '$deviceFingerprint' },
        uniqueIPs: { $addToSet: '$ipAddress' },
        suspiciousLogins: {
          $sum: { $cond: ['$isSuspicious', 1, 0] },
        },
        avgSessionDuration: { $avg: '$sessionDuration' },
        browsers: { $addToSet: '$browser' },
        devices: { $addToSet: '$device' },
      },
    },
    {
      $project: {
        totalLogins: 1,
        uniqueDeviceCount: { $size: '$uniqueDevices' },
        uniqueIPCount: { $size: '$uniqueIPs' },
        suspiciousLogins: 1,
        avgSessionDuration: { $round: ['$avgSessionDuration', 2] },
        browsers: 1,
        devices: 1,
      },
    },
  ]);
  
  return stats[0] || {
    totalLogins: 0,
    uniqueDeviceCount: 0,
    uniqueIPCount: 0,
    suspiciousLogins: 0,
    avgSessionDuration: 0,
    browsers: [],
    devices: [],
  };
};

export const LoginHistoryModel = model<LoginHistoryDocument, LoginHistoryModel>('LoginHistory', loginHistorySchema);