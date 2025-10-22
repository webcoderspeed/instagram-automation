/**
 * User Model
 * Mongoose model for managing users with authentication, profile, and subscription data
 */

import { Schema, model, Types, Document } from "mongoose";

// User Role const object
export const UserRole = {
  ADMIN: "admin",
  USER: "user",
  MODERATOR: "moderator",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

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
  loginAttempts: number;
  lockUntil?: Date;

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
  updateLastLogin(ip?: string): Promise<UserDocument>;
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
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
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
      enum: Object.values(UserRole),
      default: UserRole.USER,
      index: true,
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
      index: true,
    },
    
    // Stripe Integration
    stripeCustomerId: {
      type: String,
      index: true,
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
      index: true,
    },
    lastLoginIP: {
      type: String,
      trim: true,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,

    // Activity tracking
    lastActiveAt: {
      type: Date,
      index: true,
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
      index: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
      index: true,
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
  // Implementation would use bcrypt to compare passwords
  return Promise.resolve(true); // Placeholder
};

userSchema.methods.generatePasswordResetToken = function (
  this: UserDocument
): string {
  // Implementation would generate a secure token
  return "reset-token"; // Placeholder
};

userSchema.methods.generateEmailVerificationToken = function (
  this: UserDocument
): string {
  // Implementation would generate a secure token
  return "verification-token"; // Placeholder
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
  ip?: string
): Promise<UserDocument> {
  this.lastLoginAt = new Date();
  this.lastActiveAt = new Date();
  if (ip) this.lastLoginIP = ip;
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

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ subscriptionId: 1 });
userSchema.index({ isEmailVerified: 1 });
userSchema.index({ lastActiveAt: 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ deletedAt: 1 });
userSchema.index({ email: 1, deletedAt: 1 });
userSchema.index({ username: 1, deletedAt: 1 });

// Export the model
export const UserModel = model<UserDocument>("User", userSchema);
