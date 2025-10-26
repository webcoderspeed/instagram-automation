/**
 * Base Model
 * Common fields and methods for all Mongoose models
 */

import { Document,  Model, Types, FilterQuery, UpdateQuery } from 'mongoose';
import { BaseEntity } from '../types/common.types';

export interface BaseDocument extends Document, BaseEntity {
  _id: Types.ObjectId;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  __v: number;
}

export interface BaseModelMethods {
  softDelete(): Promise<this>;
  restore(): Promise<this>;
  isDeleted(): boolean;
  toPublicJSON(): Record<string, unknown>;
}

export interface BaseModelStatics<T extends BaseDocument> extends Model<T> {
  findByIdActive(id: string | Types.ObjectId): Promise<T | null>;
  findActive(filter?: FilterQuery<T>): Promise<T[]>;
  findOneActive(filter?: FilterQuery<T>): Promise<T | null>;
  countActive(filter?: FilterQuery<T>): Promise<number>;
  softDeleteById(id: string | Types.ObjectId): Promise<T | null>;
  restoreById(id: string | Types.ObjectId): Promise<T | null>;
}

// Base schema definition with common fields
export const baseSchemaDefinition = {
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date,
    default: null
  }
};

// Base schema options
export const baseSchemaOptions = {
  timestamps: true,
  versionKey: '__v',
  toJSON: {
    virtuals: true,
    transform: function(_doc: Document, ret: Record<string, unknown>) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(_doc: Document, ret: Record<string, unknown>) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
};

// Base schema methods
export const baseSchemaMethods = {
  softDelete: function(this: BaseDocument): Promise<BaseDocument> {
    this.deletedAt = new Date();
    return this.save();
  },

  restore: function(this: BaseDocument): Promise<BaseDocument> {
    this.deletedAt = undefined;
    return this.save();
  },

  isDeleted: function(this: BaseDocument): boolean {
    return this.deletedAt !== null && this.deletedAt !== undefined;
  },

  toPublicJSON: function(this: BaseDocument): Record<string, unknown> {
    const obj = this.toJSON();
    // Remove sensitive fields
    delete obj.deletedAt;
    delete obj.__v;
    return obj;
  }
};

// Base schema statics
export const baseSchemaStatics = {
  findByIdActive: function<T extends BaseDocument>(this: Model<T>, id: string | Types.ObjectId): Promise<T | null> {
    return this.findOne({ _id: id, deletedAt: null } as FilterQuery<T>);
  },

  findActive: function<T extends BaseDocument>(this: Model<T>, filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.find({ ...filter, deletedAt: null } as FilterQuery<T>);
  },

  findOneActive: function<T extends BaseDocument>(this: Model<T>, filter: FilterQuery<T> = {}): Promise<T | null> {
    return this.findOne({ ...filter, deletedAt: null } as FilterQuery<T>);
  },

  countActive: function<T extends BaseDocument>(this: Model<T>, filter: FilterQuery<T> = {}): Promise<number> {
    return this.countDocuments({ ...filter, deletedAt: null } as FilterQuery<T>);
  },

  softDeleteById: function<T extends BaseDocument>(this: Model<T>, id: string | Types.ObjectId): Promise<T | null> {
    return this.findByIdAndUpdate(
      id,
      { deletedAt: new Date() } as UpdateQuery<T>,
      { new: true }
    );
  },

  restoreById: function<T extends BaseDocument>(this: Model<T>, id: string | Types.ObjectId): Promise<T | null> {
    return this.findByIdAndUpdate(
      id,
      { $unset: { deletedAt: 1 } } as UpdateQuery<T>,
      { new: true }
    );
  }
};

export interface ModelOptions {
  tableName?: string;
  timestamps?: boolean;
  softDeletes?: boolean;
  paranoid?: boolean;
  underscored?: boolean;
  freezeTableName?: boolean;
  indexes?: Array<{
    fields: string[];
    unique?: boolean;
    name?: string;
  }>;
  hooks?: {
    beforeCreate?: (instance: any) => Promise<void> | void;
    afterCreate?: (instance: any) => Promise<void> | void;
    beforeUpdate?: (instance: any) => Promise<void> | void;
    afterUpdate?: (instance: any) => Promise<void> | void;
    beforeDelete?: (instance: any) => Promise<void> | void;
    afterDelete?: (instance: any) => Promise<void> | void;
  };
}

export interface QueryOptions {
  where?: Record<string, any>;
  include?: string[];
  exclude?: string[];
  order?: Array<[string, 'ASC' | 'DESC']>;
  limit?: number;
  offset?: number;
  paranoid?: boolean;
  transaction?: any;
  lock?: boolean;
  raw?: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  order?: Array<[string, 'ASC' | 'DESC']>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    index: number;
    error: string;
  }>;
}

export interface ModelValidationError {
  field: string;
  message: string;
  value: any;
}

export class ModelValidationException extends Error {
  public errors: ModelValidationError[];

  constructor(errors: ModelValidationError[]) {
    super('Model validation failed');
    this.name = 'ModelValidationException';
    this.errors = errors;
  }
}

export interface ModelEventEmitter {
  on(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
  off(event: string, listener: (...args: any[]) => void): void;
}

export const MODEL_EVENTS = {
  BEFORE_CREATE: 'beforeCreate',
  AFTER_CREATE: 'afterCreate',
  BEFORE_UPDATE: 'beforeUpdate',
  AFTER_UPDATE: 'afterUpdate',
  BEFORE_DELETE: 'beforeDelete',
  AFTER_DELETE: 'afterDelete',
  BEFORE_SAVE: 'beforeSave',
  AFTER_SAVE: 'afterSave',
  BEFORE_VALIDATE: 'beforeValidate',
  AFTER_VALIDATE: 'afterValidate',
} as const;