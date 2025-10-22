/**
 * API Types
 * Types and interfaces for API requests and responses
 */

import { Request } from 'express';
import { ValidationError, ErrorDetails, PaginationResult } from './common.types';
import { AuthenticatedUser } from './user.types';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ErrorDetails[];
  validationErrors?: ValidationError[];
  stack?: string;
  timestamp: string;
  requestId: string;
}

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  version: string;
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  data: T[];
  meta: ApiMeta & {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface ApiRequest {
  headers: Record<string, string>;
  query: Record<string, any>;
  params: Record<string, string>;
  body: any;
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
  platform?: string;
  accountId?: string;
}

export interface PlatformRequest extends Request {
  user?: AuthenticatedUser;
  validatedData?: any;
  platform: string;
  accountId: string;
}

// HTTP Status Codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

// Error Codes
export enum ErrorCode {
  // Authentication Errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_VALUE = 'INVALID_VALUE',
  
  // Resource Errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Platform Errors
  PLATFORM_NOT_SUPPORTED = 'PLATFORM_NOT_SUPPORTED',
  PLATFORM_API_ERROR = 'PLATFORM_API_ERROR',
  PLATFORM_RATE_LIMITED = 'PLATFORM_RATE_LIMITED',
  PLATFORM_UNAUTHORIZED = 'PLATFORM_UNAUTHORIZED',
  ACCOUNT_NOT_CONNECTED = 'ACCOUNT_NOT_CONNECTED',
  ACCOUNT_EXPIRED = 'ACCOUNT_EXPIRED',
  
  // Business Logic Errors
  SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED',
  FEATURE_NOT_AVAILABLE = 'FEATURE_NOT_AVAILABLE',
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    instagram: ServiceHealth;
    facebook?: ServiceHealth;
    twitter?: ServiceHealth;
    linkedin?: ServiceHealth;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

export interface RateLimitResponse {
  error: {
    code: 'RATE_LIMIT_EXCEEDED';
    message: string;
    retryAfter: number;
  };
  meta: {
    rateLimit: {
      limit: number;
      remaining: number;
      reset: number;
    };
  };
}



export interface BatchResponse<T> {
  results: Array<{
    success: boolean;
    data?: T;
    error?: ApiError;
    index: number;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    errors: ApiError[];
  };
}

export interface WebhookDeliveryResponse {
  id: string;
  status: 'delivered' | 'failed' | 'pending';
  attempts: number;
  lastAttempt?: string;
  nextAttempt?: string;
  error?: string;
}

export interface ApiMetrics {
  endpoint: string;
  method: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  lastRequest: string;
}