/**
 * Structured Automation Model
 * Mongoose model for managing type-safe automation rules based on webhook events
 */

import { Schema, model, Types, Document } from 'mongoose';
import { 
  StructuredAutomation,
  AutomationStatusType,
  TriggerTypeType,
  ActionTypeType,
  ConditionOperatorType,
  AutomationExecutionResult,
  AutomationTrigger,
  AutomationAction,
  AutomationCondition,
  AutomationSettings
} from '../types/automation.types';
import { SocialPlatform } from '../types';

// Re-export types for convenience
export { AutomationStatusType, TriggerTypeType, ActionTypeType };

// Automation Status Constants
export const AutomationStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  STOPPED: 'stopped',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

// Trigger Type Constants
export const TriggerType = {
  INSTAGRAM_MESSAGE_RECEIVED: 'instagram.message_received',
  INSTAGRAM_COMMENT_RECEIVED: 'instagram.comment_received',
  INSTAGRAM_MENTION_RECEIVED: 'instagram.mention_received',
  INSTAGRAM_STORY_MENTION: 'instagram.story_mention',
  INSTAGRAM_MEDIA_PUBLISHED: 'instagram.media_published',
  SCHEDULE_TIME_BASED: 'schedule.time_based',
  SCHEDULE_RECURRING: 'schedule.recurring',
  MANUAL_TRIGGER: 'manual.trigger'
} as const;

// Action Type Constants
export const ActionType = {
  INSTAGRAM_SEND_MESSAGE: 'instagram.send_message',
  INSTAGRAM_REPLY_TO_COMMENT: 'instagram.reply_to_comment',
  INSTAGRAM_LIKE_COMMENT: 'instagram.like_comment',
  INSTAGRAM_HIDE_COMMENT: 'instagram.hide_comment',
  INSTAGRAM_PUBLISH_POST: 'instagram.publish_post',
  INSTAGRAM_PUBLISH_STORY: 'instagram.publish_story',
  SAVE_TO_CRM: 'internal.save_to_crm',
  SEND_NOTIFICATION: 'internal.send_notification',
  WEBHOOK_CALL: 'internal.webhook_call',
  TRACK_ENGAGEMENT: 'analytics.track_engagement',
  GENERATE_REPORT: 'analytics.generate_report'
} as const;

// Automation document interface
// Structured Automation Document Interface
export interface AutomationDocument extends Document {
  // Basic Information
  name: string;
  description?: string;
  status: AutomationStatusType;
  
  // Ownership & Platform
  userId: Types.ObjectId;
  platformAccountIds: Types.ObjectId[]; // Support multiple platform accounts
  platform: SocialPlatform;
  
  // Automation Configuration
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  conditions?: AutomationCondition[];
  settings: AutomationSettings;
  
  // Execution Stats
  executionStats: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    lastExecutedAt?: Date;
    nextExecutionAt?: Date;
    averageExecutionTime: number;
    lastError?: string;
  };
  
  // Limits
  limits?: {
    maxExecutions?: number;
    dailyLimit?: number;
    monthlyLimit?: number;
  };
  
  // Metadata
  tags?: string[];
  category?: string;
  version: number;
  metadata: Record<string, unknown>;
  deletedAt?: Date;
  
  createdAt: Date,
  updatedAt: Date

  // Methods for automation lifecycle management
  execute(): Promise<AutomationExecutionResult>;
  pause(): Promise<AutomationDocument>;
  resume(): Promise<AutomationDocument>;
  stop(): Promise<AutomationDocument>;
  updateAnalytics(result: AutomationExecutionResult): Promise<AutomationDocument>;
}

// Structured Automation Schema
const automationSchema = new Schema({
  // Basic Information
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
    enum: Object.values(AutomationStatus),
    default: AutomationStatus.DRAFT
  },
  
  // Ownership & Platform
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'twitter', 'linkedin'],
    required: true
  },
  platformAccountIds: [{
    type: Schema.Types.ObjectId,
    ref: 'PlatformAccount',
    required: true
  }],
  
  // Automation Configuration - Structured Trigger
  trigger: {
    type: {
      type: String,
      enum: Object.values(TriggerType),
      required: true
    },
    config: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function(config: any) {
          // Basic validation - can be enhanced based on trigger type
          return config && typeof config === 'object';
        },
        message: 'Trigger config must be a valid object'
      }
    }
  },
  
  // Actions Configuration - Structured Actions
  actions: [{
    type: {
      type: String,
      enum: Object.values(ActionType),
      required: true
    },
    config: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function(config: any) {
          // Basic validation - can be enhanced based on action type
          return config && typeof config === 'object';
        },
        message: 'Action config must be a valid object'
      }
    }
  }],
  
  // Conditions Configuration - Structured Conditions
  conditions: [{
    field: {
      type: String,
      required: true,
      trim: true
    },
    operator: {
      type: String,
      enum: Object.values({
        EQUALS: 'equals',
        NOT_EQUALS: 'not_equals',
        CONTAINS: 'contains',
        NOT_CONTAINS: 'not_contains',
        STARTS_WITH: 'starts_with',
        ENDS_WITH: 'ends_with',
        GREATER_THAN: 'greater_than',
        LESS_THAN: 'less_than',
        GREATER_THAN_OR_EQUAL: 'greater_than_or_equal',
        LESS_THAN_OR_EQUAL: 'less_than_or_equal',
        IN: 'in',
        NOT_IN: 'not_in',
        IS_EMPTY: 'is_empty',
        IS_NOT_EMPTY: 'is_not_empty',
        REGEX_MATCH: 'regex_match'
      }),
      required: true
    },
    value: {
      type: Schema.Types.Mixed,
      required: true
    },
    logicalOperator: {
      type: String,
      enum: ['AND', 'OR'],
      default: 'AND'
    }
  }],
  
  // Settings Configuration - Structured Settings
  settings: {
    // Execution Limits
    maxExecutionsPerDay: {
      type: Number,
      min: 1,
      max: 10000
    },
    maxExecutionsPerMonth: {
      type: Number,
      min: 1,
      max: 100000
    },
    maxTotalExecutions: {
      type: Number,
      min: 1
    },
    
    // Rate Limiting
    rateLimitPerMinute: {
      type: Number,
      min: 1,
      max: 60
    },
    rateLimitPerHour: {
      type: Number,
      min: 1,
      max: 3600
    },
    
    // Timing
    activeHours: {
      start: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      end: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      timezone: {
        type: String,
        default: 'UTC'
      },
      daysOfWeek: [{
        type: Number,
        min: 0,
        max: 6
      }]
    },
    
    // Error Handling
    stopOnError: {
      type: Boolean,
      default: false
    },
    maxRetries: {
      type: Number,
      min: 0,
      max: 10,
      default: 3
    },
    retryDelay: {
      type: Number,
      min: 1,
      max: 3600,
      default: 60
    },
    
    // Notifications
    notifyOnSuccess: {
      type: Boolean,
      default: false
    },
    notifyOnError: {
      type: Boolean,
      default: true
    },
    notificationChannels: [{
      type: String,
      trim: true
    }],
    
    // Advanced
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    },
    timeout: {
      type: Number,
      min: 1,
      max: 300,
      default: 30
    },
    variables: {
      type: Map,
      of: String,
      default: new Map()
    }
  },
  
  // Execution Tracking
  executionStats: {
    totalExecutions: {
      type: Number,
      default: 0
    },
    successfulExecutions: {
      type: Number,
      default: 0
    },
    failedExecutions: {
      type: Number,
      default: 0
    },
    lastExecutedAt: Date,
    nextExecutionAt: Date,
    averageExecutionTime: {
      type: Number,
      default: 0
    },
    lastError: String
  },
  
  // Limits
  limits: {
    maxExecutions: Number,
    dailyLimit: Number,
    monthlyLimit: Number
  },
  
  // Metadata
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    trim: true,
    maxlength: 50
  },
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Soft Delete
  deletedAt: {
    type: Date,
    default: null
  },

  createdAt: Date,
  updatedAt: Date
}, {
  timestamps: true,
  collection: 'automations'
});

// Automation Methods
automationSchema.methods.execute = async function(this: AutomationDocument): Promise<AutomationExecutionResult> {
  // Implementation will be handled by automation service
  const startTime = Date.now();
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Placeholder for actual execution logic
    const executionTime = Date.now() - startTime;
    
    return {
      executionId,
      automationId: (this._id as Types.ObjectId).toString(),
      success: true,
      executedAt: new Date(),
      executionTime,
      actionsExecuted: this.actions.length,
      actionsSuccessful: this.actions.length,
      actionsFailed: 0,
      logs: [{
        timestamp: new Date(),
        level: 'info',
        message: 'Automation executed successfully'
      }]
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    return {
      executionId,
      automationId: (this._id as Types.ObjectId).toString(),
      success: false,
      executedAt: new Date(),
      executionTime,
      actionsExecuted: this.actions.length,
      actionsSuccessful: 0,
      actionsFailed: this.actions.length,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'EXECUTION_ERROR'
      },
      logs: [{
        timestamp: new Date(),
        level: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }]
    };
  }
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
  this.status = AutomationStatus.STOPPED;
  return this.save();
};

automationSchema.methods.updateAnalytics = async function(
  this: AutomationDocument, 
  result: AutomationExecutionResult
): Promise<AutomationDocument> {
  // Update execution stats
  this.executionStats.totalExecutions += 1;
  this.executionStats.lastExecutedAt = result.executedAt;
  
  if (result.success) {
    this.executionStats.successfulExecutions += 1;
  } else {
    this.executionStats.failedExecutions += 1;
    if (result.error) {
      this.executionStats.lastError = result.error.message;
    }
  }
  
  // Update average execution time
  const totalExecs = this.executionStats.totalExecutions;
  const currentAvg = this.executionStats.averageExecutionTime || 0;
  this.executionStats.averageExecutionTime = 
    ((currentAvg * (totalExecs - 1)) + result.executionTime) / totalExecs;
  
  return this.save();
};



export const AutomationModel = model<AutomationDocument>('Automation', automationSchema);