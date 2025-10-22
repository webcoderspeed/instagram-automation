/**
 * Notification Model
 * Mongoose model for managing in-app notifications, email alerts, and system messages
 */

import { Schema, model, Types, Document } from 'mongoose';

// Notification Type
export const NotificationType = {
  SYSTEM: 'system',
  AUTOMATION: 'automation',
  BILLING: 'billing',
  SECURITY: 'security',
  ANALYTICS: 'analytics',
  PLATFORM: 'platform',
  MARKETING: 'marketing'
} as const;

export type NotificationTypeType = typeof NotificationType[keyof typeof NotificationType];

// Notification Priority
export const NotificationPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

export type NotificationPriorityType = typeof NotificationPriority[keyof typeof NotificationPriority];

// Notification Channel
export const NotificationChannel = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  WEBHOOK: 'webhook'
} as const;

export type NotificationChannelType = typeof NotificationChannel[keyof typeof NotificationChannel];

// Notification Status
export const NotificationStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;

export type NotificationStatusType = typeof NotificationStatus[keyof typeof NotificationStatus];

// Notification document interface
export interface NotificationDocument extends Document {
  // Basic Info
  userId: Types.ObjectId;
  type: NotificationTypeType;
  priority: NotificationPriorityType;
  
  // Content
  title: string;
  message: string;
  data?: Record<string, unknown>;
  
  // Delivery
  channels: NotificationChannelType[];
  status: NotificationStatusType;
  
  // Scheduling
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  
  // Actions
  actions?: {
    label: string;
    action: string;
    url?: string;
    data?: Record<string, unknown>;
  }[];
  
  // References
  relatedEntity?: {
    type: string;
    id: Types.ObjectId;
  };
  
  // Delivery Details
  deliveryDetails: {
    email?: {
      to: string;
      subject: string;
      template?: string;
      sent: boolean;
      error?: string;
    };
    sms?: {
      to: string;
      sent: boolean;
      error?: string;
    };
    push?: {
      deviceTokens: string[];
      sent: boolean;
      error?: string;
    };
    webhook?: {
      url: string;
      sent: boolean;
      response?: string;
      error?: string;
    };
  };
  
  // Metadata
  metadata: Record<string, unknown>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  
  // Methods
  markAsRead(): Promise<NotificationDocument>;
  markAsSent(channel: NotificationChannelType): Promise<NotificationDocument>;
  markAsDelivered(channel: NotificationChannelType): Promise<NotificationDocument>;
  markAsFailed(channel: NotificationChannelType, error: string): Promise<NotificationDocument>;
  isExpired(): boolean;
}

const notificationSchema = new Schema({
  // Basic Info
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(NotificationType),
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: Object.values(NotificationPriority),
    default: NotificationPriority.MEDIUM,
    index: true
  },
  
  // Content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Delivery
  channels: [{
    type: String,
    enum: Object.values(NotificationChannel),
    required: true
  }],
  status: {
    type: String,
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.PENDING,
    index: true
  },
  
  // Scheduling
  scheduledAt: {
    type: Date,
    index: true
  },
  sentAt: {
    type: Date,
    index: true
  },
  deliveredAt: {
    type: Date,
    index: true
  },
  readAt: {
    type: Date,
    index: true
  },
  
  // Actions
  actions: [{
    label: {
      type: String,
      required: true,
      trim: true
    },
    action: {
      type: String,
      required: true
    },
    url: String,
    data: Schema.Types.Mixed
  }],
  
  // References
  relatedEntity: {
    type: {
      type: String,
      enum: ['automation', 'post', 'subscription', 'platform_account', 'user']
    },
    id: Schema.Types.ObjectId
  },
  
  // Delivery Details
  deliveryDetails: {
    email: {
      to: String,
      subject: String,
      template: String,
      sent: {
        type: Boolean,
        default: false
      },
      error: String
    },
    sms: {
      to: String,
      sent: {
        type: Boolean,
        default: false
      },
      error: String
    },
    push: {
      deviceTokens: [String],
      sent: {
        type: Boolean,
        default: false
      },
      error: String
    },
    webhook: {
      url: String,
      sent: {
        type: Boolean,
        default: false
      },
      response: String,
      error: String
    }
  },
  
  // Metadata
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Expiration
  expiresAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true,
  collection: 'notifications'
});

// Methods
notificationSchema.methods.markAsRead = async function(this: NotificationDocument): Promise<NotificationDocument> {
  this.status = NotificationStatus.READ;
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsSent = async function(
  this: NotificationDocument, 
  channel: NotificationChannelType
): Promise<NotificationDocument> {
  this.status = NotificationStatus.SENT;
  this.sentAt = new Date();
  
  // Update delivery details for specific channels
  if (channel === NotificationChannel.EMAIL && this.deliveryDetails.email) {
    this.deliveryDetails.email.sent = true;
  } else if (channel === NotificationChannel.SMS && this.deliveryDetails.sms) {
    this.deliveryDetails.sms.sent = true;
  } else if (channel === NotificationChannel.PUSH && this.deliveryDetails.push) {
    this.deliveryDetails.push.sent = true;
  } else if (channel === NotificationChannel.WEBHOOK && this.deliveryDetails.webhook) {
    this.deliveryDetails.webhook.sent = true;
  }
  
  return this.save();
};

notificationSchema.methods.markAsDelivered = async function(
  this: NotificationDocument, 
  channel: NotificationChannelType
): Promise<NotificationDocument> {
  this.status = NotificationStatus.DELIVERED;
  this.deliveredAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsFailed = async function(
  this: NotificationDocument, 
  channel: NotificationChannelType, 
  error: string
): Promise<NotificationDocument> {
  this.status = NotificationStatus.FAILED;
  
  // Update delivery details for specific channels
  if (channel === NotificationChannel.EMAIL && this.deliveryDetails.email) {
    this.deliveryDetails.email.error = error;
  } else if (channel === NotificationChannel.SMS && this.deliveryDetails.sms) {
    this.deliveryDetails.sms.error = error;
  } else if (channel === NotificationChannel.PUSH && this.deliveryDetails.push) {
    this.deliveryDetails.push.error = error;
  } else if (channel === NotificationChannel.WEBHOOK && this.deliveryDetails.webhook) {
    this.deliveryDetails.webhook.error = error;
  }
  
  return this.save();
};

notificationSchema.methods.isExpired = function(this: NotificationDocument): boolean {
  return this.expiresAt ? this.expiresAt < new Date() : false;
};

// Indexes
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ userId: 1, priority: 1 });
notificationSchema.index({ userId: 1, readAt: 1 });
notificationSchema.index({ status: 1, scheduledAt: 1 });
notificationSchema.index({ createdAt: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ 'relatedEntity.type': 1, 'relatedEntity.id': 1 });

// Compound indexes for common queries
notificationSchema.index({ 
  userId: 1, 
  status: 1, 
  priority: 1, 
  createdAt: -1 
});

export const NotificationModel = model<NotificationDocument>('Notification', notificationSchema);