/**
 * Base Social Media Adapter
 * 
 * Abstract base class and interfaces that define the contract
 * for all social media platform adapters in the system.
 */

import { Platform, MediaType, PostStatus } from '../../validators/platform.validator';

// Base interfaces for all platforms
export interface PlatformCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string[];
  userId?: string;
  username?: string;
}

export interface MediaObject {
  url: string;
  type: MediaType;
  alt?: string;
  thumbnail?: string;
  duration?: number;
  size?: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface PostContent {
  text?: string;
  media?: MediaObject[];
  hashtags?: string[];
  mentions?: string[];
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
  };
}

export interface PostOptions {
  disableComments?: boolean;
  disableLikes?: boolean;
  allowSharing?: boolean;
  audienceRestriction?: 'public' | 'followers' | 'private';
}

export interface SchedulingOptions {
  publishAt?: Date;
  timezone?: string;
}

export interface CreatePostRequest {
  content: PostContent;
  options?: PostOptions;
  scheduling?: SchedulingOptions;
}

export interface PostResult {
  id: string;
  platform: Platform;
  status: PostStatus;
  url?: string;
  publishedAt?: Date;
  scheduledFor?: Date;
  metrics?: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
    reach?: number;
    impressions?: number;
  };
}

export interface AccountInfo {
  id: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
  followerCount?: number;
  followingCount?: number;
  isVerified?: boolean;
  accountType?: 'personal' | 'business' | 'creator';
  bio?: string;
  website?: string;
}

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  thumbnail?: string;
  caption?: string;
  createdAt: Date;
  metrics?: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };
}

export interface AnalyticsMetrics {
  impressions?: number;
  reach?: number;
  engagement?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  views?: number;
  followersGained?: number;
  followersLost?: number;
}

export interface AnalyticsRequest {
  metrics: string[];
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate?: Date;
  endDate?: Date;
  breakdown?: 'age' | 'gender' | 'location' | 'device';
}

export interface AnalyticsResult {
  platform: Platform;
  period: string;
  data: AnalyticsMetrics;
  breakdown?: Record<string, AnalyticsMetrics>;
}

export interface AuthResult {
  success: boolean;
  credentials?: PlatformCredentials;
  account?: AccountInfo;
  error?: string;
}

export interface WebhookEvent {
  platform: Platform;
  type: string;
  data: any;
  timestamp: Date;
  signature?: string;
}

/**
 * Abstract base adapter class
 * All platform adapters must extend this class
 */
export abstract class BaseSocialMediaAdapter {
  protected platform: Platform;
  protected credentials?: PlatformCredentials;

  constructor(platform: Platform) {
    this.platform = platform;
  }

  /**
   * Authenticate with the platform
   */
  abstract authenticate(credentials: PlatformCredentials): Promise<AuthResult>;

  /**
   * Refresh authentication tokens
   */
  abstract refreshToken(refreshToken: string): Promise<AuthResult>;

  /**
   * Get account information
   */
  abstract getAccountInfo(): Promise<AccountInfo>;

  /**
   * Create a new post
   */
  abstract createPost(request: CreatePostRequest): Promise<PostResult>;

  /**
   * Update an existing post
   */
  abstract updatePost(postId: string, request: Partial<CreatePostRequest>): Promise<PostResult>;

  /**
   * Delete a post
   */
  abstract deletePost(postId: string): Promise<boolean>;

  /**
   * Get post details
   */
  abstract getPost(postId: string): Promise<PostResult>;

  /**
   * Get media items
   */
  abstract getMedia(limit?: number, offset?: number): Promise<MediaItem[]>;

  /**
   * Get analytics data
   */
  abstract getAnalytics(request: AnalyticsRequest): Promise<AnalyticsResult>;

  /**
   * Verify webhook signature
   */
  abstract verifyWebhook(payload: string, signature: string, secret: string): boolean;

  /**
   * Process webhook event
   */
  abstract processWebhook(payload: any): Promise<WebhookEvent>;

  /**
   * Get platform-specific rate limits
   */
  abstract getRateLimits(): Promise<{
    remaining: number;
    resetTime: Date;
    limit: number;
  }>;

  /**
   * Validate media for platform requirements
   */
  abstract validateMedia(media: MediaObject[]): Promise<{
    valid: boolean;
    errors?: string[];
  }>;

  /**
   * Get platform capabilities
   */
  getPlatformCapabilities(): {
    maxMediaPerPost: number;
    supportedMediaTypes: MediaType[];
    maxTextLength: number;
    supportsScheduling: boolean;
    supportsHashtags: boolean;
    supportsMentions: boolean;
    supportsLocation: boolean;
    supportsAnalytics: boolean;
  } {
    // Default capabilities - override in specific adapters
    return {
      maxMediaPerPost: 1,
      supportedMediaTypes: ['image'],
      maxTextLength: 280,
      supportsScheduling: false,
      supportsHashtags: true,
      supportsMentions: true,
      supportsLocation: false,
      supportsAnalytics: false,
    };
  }

  /**
   * Set credentials for the adapter
   */
  setCredentials(credentials: PlatformCredentials): void {
    this.credentials = credentials;
  }

  /**
   * Get current platform
   */
  getPlatform(): Platform {
    return this.platform;
  }

  /**
   * Check if adapter is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.credentials?.accessToken;
  }
}

/**
 * Adapter factory interface
 */
export interface AdapterFactory {
  createAdapter(platform: Platform): BaseSocialMediaAdapter;
  getSupportedPlatforms(): Platform[];
}

/**
 * Error classes for adapter operations
 */
export class AdapterError extends Error {
  constructor(
    message: string,
    public platform: Platform,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}

export class AuthenticationError extends AdapterError {
  constructor(platform: Platform, message: string = 'Authentication failed') {
    super(message, platform, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends AdapterError {
  constructor(platform: Platform, resetTime: Date) {
    super(`Rate limit exceeded for ${platform}. Resets at ${resetTime.toISOString()}`, platform, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends AdapterError {
  constructor(platform: Platform, errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`, platform, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}