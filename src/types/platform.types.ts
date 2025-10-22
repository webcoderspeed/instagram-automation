/**
 * Platform Types
 * 
 * Unified type definitions for all social media platforms.
 * These types are designed to be platform-agnostic while
 * accommodating platform-specific features through optional fields.
 */

import { BaseEntity, SocialPlatform, MediaFile } from './common.types';
import { Platform, MediaType } from '../validators/platform.validator';

export interface PlatformCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string[];
  tokenType?: string;
}

export interface PlatformAccount extends BaseEntity {
  userId: string;
  platform: SocialPlatform;
  platformUserId: string;
  username: string;
  displayName: string;
  email?: string;
  profilePicture?: string;
  isVerified: boolean;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  credentials: PlatformCredentials;
  isActive: boolean;
  lastSyncAt?: Date;
  metadata?: Record<string, any>;
}

export interface PlatformPost extends BaseEntity {
  accountId: string;
  platform: SocialPlatform;
  platformPostId: string;
  content: string;
  media?: MediaFile[];
  hashtags?: string[];
  mentions?: string[];
  location?: {
    name: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  publishedAt?: Date;
  scheduledAt?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
    saves?: number;
  };
  metadata?: Record<string, any>;
}

export interface PlatformComment extends BaseEntity {
  postId: string;
  platform: SocialPlatform;
  platformCommentId: string;
  authorId: string;
  authorUsername: string;
  content: string;
  parentCommentId?: string;
  isReply: boolean;
  likes?: number;
  replies?: number;
  isHidden: boolean;
  metadata?: Record<string, any>;
}

export interface PlatformMessage extends BaseEntity {
  accountId: string;
  platform: SocialPlatform;
  platformMessageId: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  media?: MediaFile[];
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'contact';
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  isAutomated: boolean;
  metadata?: Record<string, any>;
}

export interface PlatformWebhook extends BaseEntity {
  platform: SocialPlatform;
  eventType: string;
  payload: Record<string, any>;
  signature?: string;
  processed: boolean;
  processedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface PlatformAnalytics extends BaseEntity {
  accountId: string;
  platform: SocialPlatform;
  date: Date;
  metrics: {
    impressions?: number;
    reach?: number;
    engagement?: number;
    clicks?: number;
    followers?: number;
    unfollowers?: number;
    profileViews?: number;
    websiteClicks?: number;
    emailContacts?: number;
    phoneContacts?: number;
    getDirectionsClicks?: number;
  };
  metadata?: Record<string, any>;
}

export interface PlatformCapabilities {
  canPost: boolean;
  canComment: boolean;
  canMessage: boolean;
  canSchedule: boolean;
  canAnalyze: boolean;
  canManageAds: boolean;
  supportedMediaTypes: string[];
  maxMediaSize: number;
  maxTextLength: number;
  supportsHashtags: boolean;
  supportsMentions: boolean;
  supportsLocation: boolean;
  supportsPolls: boolean;
  supportsStories: boolean;
  supportsReels: boolean;
  supportsLiveStreaming: boolean;
}

/**
 * Additional types for adapter pattern
 */

/**
 * Rate limit information
 */
export interface RateLimit {
  platform: Platform;
  endpoint?: string;
  remaining: number;
  limit: number;
  resetTime: Date;
  retryAfter?: number;
}

/**
 * Platform connection status
 */
export interface PlatformConnection {
  id: string;
  userId: string;
  platform: Platform;
  accountId: string;
  status: 'connected' | 'disconnected' | 'error' | 'expired';
  credentials: PlatformCredentials;
  account: PlatformAccount;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Batch operation request
 */
export interface BatchRequest {
  platform: Platform;
  operations: Array<{
    id: string;
    type: 'create' | 'update' | 'delete';
    data: any;
  }>;
  
  // Platform-specific batch options
  platformOptions?: Record<string, any>;
}

/**
 * Batch operation result
 */
export interface BatchResult {
  platform: Platform;
  results: Array<{
    id: string;
    success: boolean;
    data?: any;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * Platform error types
 */
export interface PlatformError {
  platform: Platform;
  type: 'authentication' | 'rate_limit' | 'validation' | 'api' | 'network' | 'unknown';
  code?: string;
  message: string;
  details?: any;
  retryable: boolean;
  retryAfter?: number;
}

/**
 * Platform configuration
 */
export interface PlatformConfig {
  platform: Platform;
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  apiVersion?: string;
  baseUrl?: string;
  webhookSecret?: string;
  
  // Platform-specific configuration
  platformConfig?: Record<string, any>;
}

/**
 * User platform preferences
 */
export interface UserPlatformPreferences {
  userId: string;
  platform: Platform;
  autoPost: boolean;
  defaultHashtags: string[];
  defaultMentions: string[];
  postingSchedule?: {
    timezone: string;
    preferredTimes: string[];
    excludeDays: string[];
  };
  
  // Platform-specific preferences
  platformPreferences?: Record<string, any>;
}