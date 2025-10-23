/**
 * User Model
 * Mongoose model for managing users with authentication, profile, and subscription data
 */

import { Schema, model, Types, Document } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ROLES, ROLE_PERMISSIONS } from "../constants/permissions";

// User Role type based on permissions constants - now includes all roles
export type UserRoleType = typeof ROLES.SUPER_ADMIN | typeof ROLES.ADMIN | typeof ROLES.MANAGER | typeof ROLES.USER | typeof ROLES.VIEWER | typeof ROLES.API_CLIENT;

// Note: SubscriptionStatus moved to subscription.model.ts

// User document interface
export interface UserDocument extends Document {
  // Authentication
  email: string;
  username: string;
  passwordHash: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  // Profile
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  phoneNumber?: string;
  timezone: string;
  language: string;

  // Role & Permissions
  role: UserRoleType;
  permissions: string[];

  // Subscription Reference
  subscriptionId?: Types.ObjectId;
  
  // Stripe Integration
  stripeCustomerId?: string;

  // Security
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  lastLoginAt?: Date;
  lastLoginIP?: string;
  lastLoginUserAgent?: string;
  lastLoginLocation?: string;
  loginAttempts: number;
  totalLoginCount: number;
  lockUntil?: Date;
  
  // Device & Browser tracking
  deviceFingerprint?: string;
  trustedDevices: string[];

  // Activity tracking
  lastActiveAt?: Date;
  totalPosts: number;
  totalConnectedAccounts: number;

  // Preferences
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      profileVisible: boolean;
      analyticsSharing: boolean;
    };
    automation: {
      autoPost: boolean;
      autoReply: boolean;
    };
  };

  // Metadata
  metadata: Record<string, unknown>;

  // Platform accounts references
  platformAccounts: Types.ObjectId[];

  // Soft deletion
  deletedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(password: string): Promise<boolean>;
  generatePasswordResetToken(): string;
  generateEmailVerificationToken(): string;
  isAccountLocked(): boolean;
  incrementLoginAttempts(): Promise<UserDocument>;
  resetLoginAttempts(): Promise<UserDocument>;
  updateLastLogin(loginData?: {
    ip?: string;
    userAgent?: string;
    location?: string;
    deviceFingerprint?: string;
  }): Promise<UserDocument>;
  softDelete(): Promise<UserDocument>;
  restore(): Promise<UserDocument>;
  toPublicJSON(): Record<string, unknown>;
}

// User schema
const userSchema = new Schema(
  {
    // Authentication
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },

    // Profile
    firstName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    avatar: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    website: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    phoneNumber: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    language: {
      type: String,
      default: "en",
    },

    // Role and permissions
    role: {
      type: String,
      enum: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.USER, ROLES.VIEWER, ROLES.API_CLIENT],
      default: ROLES.USER,
    },
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],

    // Subscription Reference
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
    },

    // Stripe
    stripeCustomerId: {
      type: String,
    },

    // Security
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    lastLoginAt: {
      type: Date,
    },
    lastLoginIP: {
      type: String,
      trim: true,
    },
    lastLoginUserAgent: {
      type: String,
      trim: true,
    },
    lastLoginLocation: {
      type: String,
      trim: true,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    totalLoginCount: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    
    // Device & Browser tracking
    deviceFingerprint: {
      type: String,
      trim: true,
    },
    trustedDevices: [{
      type: String,
      trim: true,
    }],

    // Activity tracking
    lastActiveAt: {
      type: Date,
    },
    totalPosts: {
      type: Number,
      default: 0,
    },
    totalConnectedAccounts: {
      type: Number,
      default: 0,
    },

    // Preferences
    preferences: {
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
      },
      privacy: {
        profileVisible: {
          type: Boolean,
          default: true,
        },
        analyticsSharing: {
          type: Boolean,
          default: false,
        },
      },
      automation: {
        autoPost: {
          type: Boolean,
          default: false,
        },
        autoReply: {
          type: Boolean,
          default: false,
        },
      },
    },

    // Metadata
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // Platform accounts references
    platformAccounts: [
      {
        type: Schema.Types.ObjectId,
        ref: "PlatformAccount",
      },
    ],

    // Soft deletion
    deletedAt: {
      type: Date,
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

// Instance methods
userSchema.methods.comparePassword = async function (
  this: UserDocument,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.generatePasswordResetToken = function (
  this: UserDocument
): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return resetToken;
};

userSchema.methods.generateEmailVerificationToken = function (
  this: UserDocument
): string {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return verificationToken;
};

userSchema.methods.isAccountLocked = function (this: UserDocument): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

userSchema.methods.incrementLoginAttempts = async function (
  this: UserDocument
): Promise<UserDocument> {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
  return this.save();
};

userSchema.methods.resetLoginAttempts = async function (
  this: UserDocument
): Promise<UserDocument> {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  return this.save();
};

userSchema.methods.updateLastLogin = async function (
  this: UserDocument,
  loginData?: {
    ip?: string;
    userAgent?: string;
    location?: string;
    deviceFingerprint?: string;
  }
): Promise<UserDocument> {
  this.lastLoginAt = new Date();
  this.lastActiveAt = new Date();
  this.totalLoginCount = (this.totalLoginCount || 0) + 1;
  
  if (loginData?.ip) this.lastLoginIP = loginData.ip;
  if (loginData?.userAgent) this.lastLoginUserAgent = loginData.userAgent;
  if (loginData?.location) this.lastLoginLocation = loginData.location;
  if (loginData?.deviceFingerprint) {
    this.deviceFingerprint = loginData.deviceFingerprint;
    
    // Add to trusted devices if not already present
    if (!this.trustedDevices.includes(loginData.deviceFingerprint)) {
      this.trustedDevices.push(loginData.deviceFingerprint);
      
      // Keep only last 5 trusted devices
      if (this.trustedDevices.length > 5) {
        this.trustedDevices = this.trustedDevices.slice(-5);
      }
    }
  }
  
  return this.save();
};

userSchema.methods.softDelete = async function (
  this: UserDocument
): Promise<UserDocument> {
  this.deletedAt = new Date();
  return this.save();
};

userSchema.methods.restore = async function (
  this: UserDocument
): Promise<UserDocument> {
  this.deletedAt = undefined;
  return this.save();
};

userSchema.methods.toPublicJSON = function (
  this: UserDocument
): Record<string, unknown> {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  delete obj.twoFactorSecret;
  return obj;
};

// Pre-save hook to populate permissions based on role
userSchema.pre('save', function(this: UserDocument, next) {
  // Only populate permissions if role has changed or permissions are empty
  if (this.isModified('role') || !this.permissions || this.permissions.length === 0) {
    // Map user model roles to permission system roles
    const roleMapping: Partial<Record<UserRoleType, keyof typeof ROLE_PERMISSIONS>> = {
      [ROLES.SUPER_ADMIN]: 'super_admin',
      [ROLES.ADMIN]: 'admin',
      [ROLES.MANAGER]: 'manager',
      [ROLES.USER]: 'user',
      [ROLES.VIEWER]: 'viewer',
      [ROLES.API_CLIENT]: 'api_client'
    };

    const permissionRole = roleMapping[this.role];
    if (permissionRole && ROLE_PERMISSIONS[permissionRole]) {
      this.permissions = [...ROLE_PERMISSIONS[permissionRole]];
    } else {
      // Fallback to user permissions if role not found
      this.permissions = [...ROLE_PERMISSIONS.user];
    }
  }
  next();
});

// Export the model
export const UserModel = model<UserDocument>("User", userSchema);
