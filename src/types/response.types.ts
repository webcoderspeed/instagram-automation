/**
 * Response Types
 * Standardized response types for API endpoints
 */

import { ApiResponse, ApiError, ApiMeta } from './api.types';
import { User } from './user.types';
import { PlatformAccount, PlatformPost, PlatformMessage } from './platform.types';
import { Conversation, Message, MessageTemplate } from './message.types';
import { WebhookEvent } from './webhook.types';

// Authentication Responses
export interface LoginResponse extends ApiResponse<{
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}> {}

export interface RefreshTokenResponse extends ApiResponse<{
  accessToken: string;
  expiresIn: number;
}> {}

export interface LogoutResponse extends ApiResponse<{
  message: string;
}> {}

// User Responses
export interface UserResponse extends ApiResponse<User> {}
export interface UsersResponse extends ApiResponse<User[]> {}
export interface UserProfileResponse extends ApiResponse<{
  user: User;
  stats: {
    connectedAccounts: number;
    totalPosts: number;
    totalMessages: number;
    automationRules: number;
  };
}> {}

// Platform Account Responses
export interface PlatformAccountResponse extends ApiResponse<PlatformAccount> {}
export interface PlatformAccountsResponse extends ApiResponse<PlatformAccount[]> {}
export interface ConnectAccountResponse extends ApiResponse<{
  account: PlatformAccount;
  authUrl?: string;
}> {}

// Post Responses
export interface PostResponse extends ApiResponse<PlatformPost> {}
export interface PostsResponse extends ApiResponse<PlatformPost[]> {}
export interface CreatePostResponse extends ApiResponse<{
  post: PlatformPost;
  platformResponse: Record<string, any>;
}> {}
export interface SchedulePostResponse extends ApiResponse<{
  post: PlatformPost;
  scheduledFor: Date;
}> {}

// Message Responses
export interface MessageResponse extends ApiResponse<Message> {}
export interface MessagesResponse extends ApiResponse<Message[]> {}
export interface ConversationResponse extends ApiResponse<Conversation> {}
export interface ConversationsResponse extends ApiResponse<Conversation[]> {}
export interface SendMessageResponse extends ApiResponse<{
  message: Message;
  platformResponse: Record<string, any>;
}> {}

// Template Responses
export interface TemplateResponse extends ApiResponse<MessageTemplate> {}
export interface TemplatesResponse extends ApiResponse<MessageTemplate[]> {}

// Webhook Responses
export interface WebhookEventResponse extends ApiResponse<WebhookEvent> {}
export interface WebhookEventsResponse extends ApiResponse<WebhookEvent[]> {}
export interface WebhookVerificationResponse extends ApiResponse<{
  challenge: string;
}> {}

// Analytics Responses
export interface AnalyticsResponse extends ApiResponse<{
  platform: string;
  dateRange: {
    from: Date;
    to: Date;
  };
  metrics: {
    posts: {
      total: number;
      published: number;
      scheduled: number;
      failed: number;
    };
    engagement: {
      likes: number;
      comments: number;
      shares: number;
      views: number;
      saves: number;
    };
    messages: {
      total: number;
      inbound: number;
      outbound: number;
      automated: number;
    };
    followers: {
      gained: number;
      lost: number;
      total: number;
    };
  };
  charts: {
    engagement: Array<{
      date: Date;
      likes: number;
      comments: number;
      shares: number;
    }>;
    followers: Array<{
      date: Date;
      count: number;
      gained: number;
      lost: number;
    }>;
    posts: Array<{
      date: Date;
      count: number;
    }>;
  };
}> {}

// OAuth Responses
export interface OAuthAuthorizationResponse extends ApiResponse<{
  authUrl: string;
  state: string;
}> {}

export interface OAuthCallbackResponse extends ApiResponse<{
  account: PlatformAccount;
  isNewAccount: boolean;
}> {}

export interface OAuthTokenResponse extends ApiResponse<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string[];
}> {}

// Upload Responses
export interface UploadResponse extends ApiResponse<{
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}> {}

export interface MultipleUploadResponse extends ApiResponse<Array<{
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  error?: string;
}>> {}

// Search Responses
export interface SearchResponse<T> extends ApiResponse<{
  results: T[];
  query: string;
  filters: Record<string, any>;
  facets?: Record<string, Array<{
    value: string;
    count: number;
  }>>;
}> {}

// Bulk Operation Responses
export interface BulkOperationResponse<T> extends ApiResponse<{
  successful: T[];
  failed: Array<{
    item: T;
    error: ApiError;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}> {}

// Export Responses
export interface ExportResponse extends ApiResponse<{
  exportId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
  recordCount?: number;
}> {}

// Import Responses
export interface ImportResponse extends ApiResponse<{
  importId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  summary?: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  errors?: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}> {}

// Subscription Responses
export interface SubscriptionResponse extends ApiResponse<{
  plan: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  features: string[];
  limits: Record<string, number>;
  usage: Record<string, number>;
}> {}

// Error Responses
export interface ErrorResponse extends ApiResponse<never> {
  success: false;
  error: ApiError;
}

export interface ValidationErrorResponse extends ErrorResponse {
  error: ApiError & {
    validationErrors: Array<{
      field: string;
      message: string;
      value?: any;
    }>;
  };
}

export interface RateLimitErrorResponse extends ErrorResponse {
  error: ApiError & {
    retryAfter: number;
  };
  meta: ApiMeta & {
    rateLimit: {
      limit: number;
      remaining: number;
      reset: number;
    };
  };
}