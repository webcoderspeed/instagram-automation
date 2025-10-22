/**
 * Automation Model
 * Mongoose model for managing automation rules, triggers, and scheduling
 */

import { Schema, model, Types, Document } from 'mongoose';

// Automation Status
export const AutomationStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

export type AutomationStatusType = typeof AutomationStatus[keyof typeof AutomationStatus];

// Automation Type
export const AutomationType = {
  POST_SCHEDULING: 'post_scheduling',
  AUTO_REPLY: 'auto_reply',
  CONTENT_CURATION: 'content_curation',
  ENGAGEMENT: 'engagement',
  ANALYTICS_REPORT: 'analytics_report',
  CROSS_POSTING: 'cross_posting'
} as const;

export type AutomationTypeType = typeof AutomationType[keyof typeof AutomationType];

// Trigger Type
export const TriggerType = {
  SCHEDULE: 'schedule',
  EVENT: 'event',
  CONDITION: 'condition',
  WEBHOOK: 'webhook'
} as const;

export type TriggerTypeType = typeof TriggerType[keyof typeof TriggerType];

// Automation document interface
export interface AutomationDocument extends Document {
  // Basic Info
  name: string;
  description?: string;
  type: AutomationTypeType;
  status: AutomationStatusType;
  
  // Ownership
  userId: Types.ObjectId;
  platformAccounts: Types.ObjectId[];
  
  // Configuration
  config: {
    triggers: {
      type: TriggerTypeType;
      schedule?: {
        cron?: string;
        timezone?: string;
        startDate?: Date;
        endDate?: Date;
      };
      event?: {
        eventType: string;
        conditions: Record<string, unknown>;
      };
      webhook?: {
        url: string;
        secret?: string;
      };
    }[];
    actions: {
      type: string;
      platform: string;
      config: Record<string, unknown>;
    }[];
    conditions?: {
      field: string;
      operator: string;
      value: unknown;
    }[];
  };
  
  // Execution
  lastExecutedAt?: Date;
  nextExecutionAt?: Date;
  executionCount: number;
  successCount: number;
  failureCount: number;
  
  // Limits
  maxExecutions?: number;
  dailyLimit?: number;
  monthlyLimit?: number;
  
  // Analytics
  analytics: {
    totalRuns: number;
    successRate: number;
    avgExecutionTime: number;
    lastError?: string;
    errorCount: number;
  };
  
  // Metadata
  tags: string[];
  metadata: Record<string, unknown>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  
  // Methods
  execute(): Promise<boolean>;
  pause(): Promise<AutomationDocument>;
  resume(): Promise<AutomationDocument>;
  stop(): Promise<AutomationDocument>;
  updateAnalytics(success: boolean, executionTime: number, error?: string): Promise<AutomationDocument>;
}

const automationSchema = new Schema({
  // Basic Info
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
  type: {
    type: String,
    enum: Object.values(AutomationType),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(AutomationStatus),
    default: AutomationStatus.INACTIVE
  },
  
  // Ownership
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platformAccounts: [{
    type: Schema.Types.ObjectId,
    ref: 'PlatformAccount'
  }],
  
  // Configuration
  config: {
    triggers: [{
      type: {
        type: String,
        enum: Object.values(TriggerType),
        required: true
      },
      schedule: {
        cron: String,
        timezone: {
          type: String,
          default: 'UTC'
        },
        startDate: Date,
        endDate: Date
      },
      event: {
        eventType: String,
        conditions: Schema.Types.Mixed
      },
      webhook: {
        url: String,
        secret: String
      }
    }],
    actions: [{
      type: {
        type: String,
        required: true
      },
      platform: {
        type: String,
        required: true
      },
      config: {
        type: Schema.Types.Mixed,
        required: true
      }
    }],
    conditions: [{
      field: String,
      operator: String,
      value: Schema.Types.Mixed
    }]
  },
  
  // Execution
  lastExecutedAt: {
    type: Date
  },
  nextExecutionAt: {
    type: Date
  },
  executionCount: {
    type: Number,
    default: 0
  },
  successCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  },
  
  // Limits
  maxExecutions: Number,
  dailyLimit: Number,
  monthlyLimit: Number,
  
  // Analytics
  analytics: {
    totalRuns: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    },
    avgExecutionTime: {
      type: Number,
      default: 0
    },
    lastError: String,
    errorCount: {
      type: Number,
      default: 0
    }
  },
  
  // Metadata
  tags: [{
    type: String,
    trim: true
  }],
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
  collection: 'automations'
});

// Methods
automationSchema.methods.execute = async function(this: AutomationDocument): Promise<boolean> {
  // Implementation will be in automation service
  return true;
};

automationSchema.methods.pause = async function(this: AutomationDocument): Promise<AutomationDocument> {
  this.status = AutomationStatus.PAUSED;
  return this.save();
};

automationSchema.methods.resume = async function(this: AutomationDocument): Promise<AutomationDocument> {
  this.status = AutomationStatus.ACTIVE;
  return this.save();
};

automationSchema.methods.stop = async function(this: AutomationDocument): Promise<AutomationDocument> {
  this.status = AutomationStatus.INACTIVE;
  return this.save();
};

automationSchema.methods.updateAnalytics = async function(
  this: AutomationDocument, 
  success: boolean, 
  executionTime: number, 
  error?: string
): Promise<AutomationDocument> {
  this.analytics.totalRuns += 1;
  this.analytics.avgExecutionTime = (this.analytics.avgExecutionTime + executionTime) / 2;
  
  if (success) {
    this.successCount += 1;
  } else {
    this.failureCount += 1;
    this.analytics.errorCount += 1;
    if (error) {
      this.analytics.lastError = error;
    }
  }
  
  this.analytics.successRate = (this.successCount / this.analytics.totalRuns) * 100;
  this.lastExecutedAt = new Date();
  
  return this.save();
};



export const AutomationModel = model<AutomationDocument>('Automation', automationSchema);