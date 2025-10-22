import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

/**
 * Session Interface
 * Defines the structure for user session data
 */
export interface ISession extends Document {
  sessionId: string;
  userId: mongoose.Types.ObjectId;
  accessToken: string;
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  
  // Methods
  generateSessionId(): string;
  isExpired(): boolean;
  updateLastAccessed(): Promise<ISession>;
  deactivate(): Promise<ISession>;
}

/**
 * Session Schema
 * MongoDB schema for user sessions with security features
 */
const sessionSchema = new Schema<ISession>({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index for automatic cleanup
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'sessions'
});

// Compound indexes for better query performance
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ sessionId: 1, isActive: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Generate unique session ID
 */
sessionSchema.methods.generateSessionId = function(): string {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Check if session is expired
 */
sessionSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

/**
 * Update last accessed timestamp
 */
sessionSchema.methods.updateLastAccessed = async function(): Promise<ISession> {
  this.lastAccessedAt = new Date();
  return await this.save();
};

/**
 * Deactivate session
 */
sessionSchema.methods.deactivate = async function(): Promise<ISession> {
  this.isActive = false;
  return await this.save();
};

/**
 * Pre-save middleware to generate session ID
 */
sessionSchema.pre('save', function(next) {
  if (this.isNew && !this.sessionId) {
    this.sessionId = this.generateSessionId();
  }
  next();
});

/**
 * Static methods for session management
 */
sessionSchema.statics.findActiveSession = function(sessionId: string) {
  return this.findOne({ 
    sessionId, 
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).populate('userId');
};

sessionSchema.statics.deactivateUserSessions = function(userId: mongoose.Types.ObjectId) {
  return this.updateMany(
    { userId, isActive: true },
    { isActive: false }
  );
};

sessionSchema.statics.cleanupExpiredSessions = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isActive: false }
    ]
  });
};

sessionSchema.statics.getUserActiveSessions = function(userId: mongoose.Types.ObjectId) {
  return this.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).sort({ lastAccessedAt: -1 });
};

/**
 * Session Model
 */
const Session = mongoose.model<ISession>('Session', sessionSchema);

export default Session;