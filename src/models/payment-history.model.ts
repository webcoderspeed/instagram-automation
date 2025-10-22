import { Schema, model, Types, Model } from 'mongoose';
import { BaseDocument } from './base.model';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  WALLET = 'wallet'
}

export interface PaymentHistoryDocument extends BaseDocument {
  userId: Types.ObjectId;
  subscriptionId: Types.ObjectId;
  transactionId: string;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  description: string;
  paymentDate: Date;
  failureReason?: string;
  refundAmount?: number;
  refundDate?: Date;
  metadata?: Record<string, any>;
}

export interface PaymentHistoryModel extends Model<PaymentHistoryDocument> {
  findByUser(userId: string, options?: {
    page?: number;
    limit?: number;
    status?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<PaymentHistoryDocument[]>;
  
  findBySubscription(subscriptionId: string, options?: {
    page?: number;
    limit?: number;
    status?: PaymentStatus;
  }): Promise<PaymentHistoryDocument[]>;
  
  getPaymentStats(userId: string, period?: 'month' | 'year'): Promise<any[]>;
}

const PaymentHistorySchema = new Schema<PaymentHistoryDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subscriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true,
    index: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  stripePaymentIntentId: {
    type: String,
    sparse: true,
    index: true
  },
  stripeInvoiceId: {
    type: String,
    sparse: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    uppercase: true,
    default: 'USD'
  },
  status: {
    type: String,
    enum: Object.values(PaymentStatus),
    required: true,
    default: PaymentStatus.PENDING,
    index: true
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PaymentMethod),
    required: true,
    default: PaymentMethod.CARD
  },
  description: {
    type: String,
    required: true
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  failureReason: {
    type: String
  },
  refundAmount: {
    type: Number,
    min: 0
  },
  refundDate: {
    type: Date
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true,
  collection: 'payment_history'
});

// Compound indexes for efficient queries
PaymentHistorySchema.index({ userId: 1, paymentDate: -1 });
PaymentHistorySchema.index({ subscriptionId: 1, paymentDate: -1 });
PaymentHistorySchema.index({ userId: 1, status: 1, paymentDate: -1 });
PaymentHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 * 7 }); // 7 years retention

// Static methods for common queries
PaymentHistorySchema.statics.findByUser = function(userId: string, options: {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
} = {}) {
  const {
    page = 1,
    limit = 10,
    status,
    startDate,
    endDate
  } = options;

  const query: any = { userId };
  
  if (status) {
    query.status = status;
  }
  
  if (startDate || endDate) {
    query.paymentDate = {};
    if (startDate) query.paymentDate.$gte = startDate;
    if (endDate) query.paymentDate.$lte = endDate;
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .sort({ paymentDate: -1 })
    .skip(skip)
    .limit(limit)
    .populate('subscriptionId', 'plan status')
    .lean();
};

PaymentHistorySchema.statics.findBySubscription = function(subscriptionId: string, options: {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
} = {}) {
  const { page = 1, limit = 10, status } = options;
  
  const query: any = { subscriptionId };
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .sort({ paymentDate: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

PaymentHistorySchema.statics.getPaymentStats = function(userId: string, period: 'month' | 'year' = 'month') {
  const now = new Date();
  const startDate = new Date();
  
  if (period === 'month') {
    startDate.setMonth(now.getMonth() - 1);
  } else {
    startDate.setFullYear(now.getFullYear() - 1);
  }

  return this.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        paymentDate: { $gte: startDate },
        status: PaymentStatus.COMPLETED
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalPayments: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
};

export const PaymentHistoryModel = model<PaymentHistoryDocument, PaymentHistoryModel>('PaymentHistory', PaymentHistorySchema);