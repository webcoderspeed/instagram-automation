/**
 * Subscription Model
 * Mongoose model for managing user subscription plans, billing, and payment history
 */

import { Schema, model, Types, Document } from 'mongoose';

// Subscription Plan
export const SubscriptionPlan = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
} as const;

export type SubscriptionPlanType = typeof SubscriptionPlan[keyof typeof SubscriptionPlan];

// Subscription Status
export const SubscriptionStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  PAST_DUE: 'past_due',
  TRIALING: 'trialing',
  PAUSED: 'paused'
} as const;

export type SubscriptionStatusType = typeof SubscriptionStatus[keyof typeof SubscriptionStatus];

// Billing Cycle
export const BillingCycle = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime'
} as const;

export type BillingCycleType = typeof BillingCycle[keyof typeof BillingCycle];



// Plan Features Interface
export interface PlanFeatures {
  maxPlatformAccounts: number;
  maxAutomations: number;
  maxPostsPerMonth: number;
  maxStorageGB: number;
  analyticsRetentionDays: number;
  prioritySupport: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  webhooks: boolean;
  teamMembers: number;
  advancedAnalytics: boolean;
  bulkOperations: boolean;
}



// Subscription document interface
export interface SubscriptionDocument extends Document {
  // Basic Info
  userId: Types.ObjectId;
  plan: SubscriptionPlanType;
  status: SubscriptionStatusType;
  billingCycle: BillingCycleType;
  
  // Pricing
  price: number;
  currency: string;
  
  // Dates
  startDate: Date;
  endDate?: Date;
  trialEndDate?: Date;
  cancelledAt?: Date;
  pausedAt?: Date;
  
  // Features & Limits
  features: PlanFeatures;
  usage: {
    platformAccounts: number;
    automations: number;
    postsThisMonth: number;
    storageUsedGB: number;
    apiCallsThisMonth: number;
  };
  
  // Billing
  stripeSubscriptionId?: string;
  paymentMethodId?: string;
  nextBillingDate?: Date;
  lastBillingDate?: Date;
  

  
  // Discounts & Coupons
  discountPercent?: number;
  couponCode?: string;
  couponValidUntil?: Date;
  
  // Metadata
  metadata: Record<string, unknown>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  isActive(): boolean;
  isExpired(): boolean;
  canUseFeature(feature: keyof PlanFeatures): boolean;
  getRemainingUsage(feature: keyof PlanFeatures): number;

  cancel(): Promise<SubscriptionDocument>;
  pause(): Promise<SubscriptionDocument>;
  resume(): Promise<SubscriptionDocument>;
  upgrade(newPlan: SubscriptionPlanType): Promise<SubscriptionDocument>;
}

const subscriptionSchema = new Schema({
  // Basic Info
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: Object.values(SubscriptionPlan),
    default: SubscriptionPlan.FREE
  },
  status: {
    type: String,
    enum: Object.values(SubscriptionStatus),
    default: SubscriptionStatus.ACTIVE
  },
  billingCycle: {
    type: String,
    enum: Object.values(BillingCycle),
    default: BillingCycle.MONTHLY
  },
  
  // Pricing
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  
  // Dates
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  trialEndDate: {
    type: Date
  },
  cancelledAt: Date,
  pausedAt: Date,
  
  // Features & Limits
  features: {
    maxPlatformAccounts: {
      type: Number,
      default: 1
    },
    maxAutomations: {
      type: Number,
      default: 3
    },
    maxPostsPerMonth: {
      type: Number,
      default: 30
    },
    maxStorageGB: {
      type: Number,
      default: 1
    },
    analyticsRetentionDays: {
      type: Number,
      default: 30
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    customBranding: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    webhooks: {
      type: Boolean,
      default: false
    },
    teamMembers: {
      type: Number,
      default: 1
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    bulkOperations: {
      type: Boolean,
      default: false
    }
  },
  
  usage: {
    platformAccounts: {
      type: Number,
      default: 0
    },
    automations: {
      type: Number,
      default: 0
    },
    postsThisMonth: {
      type: Number,
      default: 0
    },
    storageUsedGB: {
      type: Number,
      default: 0
    },
    apiCallsThisMonth: {
      type: Number,
      default: 0
    }
  },
  
  // Billing
  stripeSubscriptionId: {
    type: String
  },
  paymentMethodId: String,
  nextBillingDate: {
    type: Date
  },
  lastBillingDate: Date,
  

  
  // Discounts & Coupons
  discountPercent: {
    type: Number,
    min: 0,
    max: 100
  },
  couponCode: String,
  couponValidUntil: Date,
  
  // Metadata
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'subscriptions'
});

// Methods
subscriptionSchema.methods.isActive = function(this: SubscriptionDocument): boolean {
  return this.status === SubscriptionStatus.ACTIVE && 
         (!this.endDate || this.endDate > new Date());
};

subscriptionSchema.methods.isExpired = function(this: SubscriptionDocument): boolean {
  return this.endDate ? this.endDate < new Date() : false;
};

subscriptionSchema.methods.canUseFeature = function(
  this: SubscriptionDocument, 
  feature: keyof PlanFeatures
): boolean {
  const featureValue = this.features[feature];
  const usageValue = this.usage[feature as keyof typeof this.usage];
  
  if (typeof featureValue === 'boolean') {
    return featureValue;
  }
  
  if (typeof featureValue === 'number' && typeof usageValue === 'number') {
    return usageValue < featureValue;
  }
  
  return false;
};

subscriptionSchema.methods.getRemainingUsage = function(
  this: SubscriptionDocument, 
  feature: keyof PlanFeatures
): number {
  const featureValue = this.features[feature];
  const usageValue = this.usage[feature as keyof typeof this.usage];
  
  if (typeof featureValue === 'number' && typeof usageValue === 'number') {
    return Math.max(0, featureValue - usageValue);
  }
  
  return 0;
};



subscriptionSchema.methods.cancel = async function(this: SubscriptionDocument): Promise<SubscriptionDocument> {
  this.status = SubscriptionStatus.CANCELLED;
  this.cancelledAt = new Date();
  return this.save();
};

subscriptionSchema.methods.pause = async function(this: SubscriptionDocument): Promise<SubscriptionDocument> {
  this.status = SubscriptionStatus.PAUSED;
  this.pausedAt = new Date();
  return this.save();
};

subscriptionSchema.methods.resume = async function(this: SubscriptionDocument): Promise<SubscriptionDocument> {
  this.status = SubscriptionStatus.ACTIVE;
  this.pausedAt = undefined;
  return this.save();
};

subscriptionSchema.methods.upgrade = async function(
  this: SubscriptionDocument, 
  newPlan: SubscriptionPlanType
): Promise<SubscriptionDocument> {
  this.plan = newPlan;
  // Update features based on new plan
  // This would be implemented based on your plan configuration
  return this.save();
};

export const SubscriptionModel = model<SubscriptionDocument>('Subscription', subscriptionSchema);