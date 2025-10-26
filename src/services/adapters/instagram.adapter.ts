/**
 * Instagram Adapter
 * 
 * Instagram-specific implementation of the social media adapter
 * using Instagram Graph API for business accounts.
 */

import crypto from 'crypto';
import {
  BaseSocialMediaAdapter,
  PlatformCredentials,
  AuthResult,
  AccountInfo,
  CreatePostRequest,
  PostResult,
  MediaItem,
  AnalyticsRequest,
  AnalyticsResult,
  WebhookEvent,
  MediaObject,
  AuthenticationError,
  RateLimitError,
  ValidationError,
} from './base.adapter';
import { Platform, MediaType } from '../../validators/platform.validator';
import logger from '../../utils/logger';

export class InstagramAdapter extends BaseSocialMediaAdapter {
  private readonly baseUrl = 'https://graph.facebook.com/v18.0';
  private readonly maxRetries = 3;

  constructor() {
    super('instagram' as Platform);
  }

  /**
   * Authenticate with Instagram Graph API
   */
  async authenticate(credentials: PlatformCredentials): Promise<AuthResult> {
    try {
      this.setCredentials(credentials);

      // Verify the access token by getting account info
      const accountInfo = await this.getAccountInfo();
      
      return {
        success: true,
        credentials,
        account: accountInfo,
      };
    } catch (error) {
      logger.error('Instagram authentication failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  /**
   * Refresh Instagram access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'fb_exchange_token',
          client_id: process.env.INSTAGRAM_CLIENT_ID || '',
          client_secret: process.env.INSTAGRAM_CLIENT_SECRET || '',
          fb_exchange_token: refreshToken,
        }),
      });

      const data = await response.json() as {
        access_token: string;
        expires_in: number;
        error?: { message: string };
      };

      if (!response.ok) {
        throw new AuthenticationError(this.platform, data.error?.message || 'Token refresh failed');
      }

      const newCredentials: PlatformCredentials = {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      };

      return this.authenticate(newCredentials);
    } catch (error) {
      logger.error('Instagram token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Get Instagram account information
   */
  async getAccountInfo(): Promise<AccountInfo> {
    const response = await this.makeRequest('/me', {
      fields: 'id,username,name,profile_picture_url,followers_count,follows_count,media_count,account_type,biography,website',
    });

    return {
      id: response.id,
      username: response.username,
      displayName: response.name,
      profilePicture: response.profile_picture_url,
      followerCount: response.followers_count,
      followingCount: response.follows_count,
      accountType: response.account_type?.toLowerCase() as 'personal' | 'business' | 'creator',
      bio: response.biography,
      website: response.website,
      isVerified: false, // Instagram Graph API doesn't provide this directly
    };
  }

  /**
   * Create Instagram post
   */
  async createPost(request: CreatePostRequest): Promise<PostResult> {
    try {
      // Validate media first
      if (request.content.media) {
        const validation = await this.validateMedia(request.content.media);
        if (!validation.valid) {
          throw new ValidationError(this.platform, validation.errors || []);
        }
      }

      let mediaId: string;

      if (request.content.media && request.content.media.length > 0) {
        if (request.content.media.length === 1) {
          // Single media post
          mediaId = await this.uploadSingleMedia(request.content.media[0], request.content.text);
        } else {
          // Carousel post
          mediaId = await this.uploadCarouselMedia(request.content.media, request.content.text);
        }
      } else {
        throw new ValidationError(this.platform, ['Instagram requires at least one media item']);
      }

      // Publish the media
      const publishResponse = await this.makeRequest('/me/media_publish', {
        creation_id: mediaId,
      }, 'POST');

      return {
        id: publishResponse.id,
        platform: this.platform,
        status: 'published',
        url: `https://www.instagram.com/p/${publishResponse.id}/`,
        publishedAt: new Date(),
      };
    } catch (error) {
      logger.error('Instagram post creation failed:', error);
      throw error;
    }
  }

  /**
   * Update Instagram post (limited support)
   */
  async updatePost(postId: string, request: Partial<CreatePostRequest>): Promise<PostResult> {
    // Instagram doesn't support editing posts after publication
    // Only caption can be updated for some media types
    throw new Error('Instagram does not support post editing after publication');
  }

  /**
   * Delete Instagram post
   */
  async deletePost(postId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/${postId}`, {}, 'DELETE');
      return true;
    } catch (error) {
      logger.error('Instagram post deletion failed:', error);
      return false;
    }
  }

  /**
   * Get Instagram post details
   */
  async getPost(postId: string): Promise<PostResult> {
    const response = await this.makeRequest(`/${postId}`, {
      fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
    });

    return {
      id: response.id,
      platform: this.platform,
      status: 'published',
      url: response.permalink,
      publishedAt: new Date(response.timestamp),
      metrics: {
        likes: response.like_count,
        comments: response.comments_count,
      },
    };
  }

  /**
   * Get Instagram media items
   */
  async getMedia(limit: number = 25, offset: number = 0): Promise<MediaItem[]> {
    const response = await this.makeRequest('/me/media', {
      fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
      limit: limit.toString(),
      offset: offset.toString(),
    });

    return response.data.map((item: any) => ({
      id: item.id,
      type: this.mapInstagramMediaType(item.media_type),
      url: item.media_url,
      thumbnail: item.thumbnail_url,
      caption: item.caption,
      createdAt: new Date(item.timestamp),
      metrics: {
        likes: item.like_count,
        comments: item.comments_count,
      },
    }));
  }

  /**
   * Get Instagram analytics
   */
  async getAnalytics(request: AnalyticsRequest): Promise<AnalyticsResult> {
    const metrics = request.metrics.join(',');
    const period = this.mapAnalyticsPeriod(request.period);

    const response = await this.makeRequest('/me/insights', {
      metric: metrics,
      period,
      since: request.startDate?.toISOString(),
      until: request.endDate?.toISOString(),
    });

    const data: any = {};
    response.data.forEach((metric: any) => {
      data[metric.name] = metric.values[0]?.value || 0;
    });

    return {
      platform: this.platform,
      period: request.period,
      data,
    };
  }

  /**
   * Verify Instagram webhook signature
   */
  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Process Instagram webhook event
   */
  async processWebhook(payload: any): Promise<WebhookEvent> {
    return {
      platform: this.platform,
      type: payload.object || 'unknown',
      data: payload,
      timestamp: new Date(),
    };
  }

  /**
   * Get Instagram rate limits
   */
  async getRateLimits(): Promise<{ remaining: number; resetTime: Date; limit: number }> {
    // Instagram uses app-level rate limiting
    // This is a simplified implementation
    return {
      remaining: 200,
      resetTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      limit: 200,
    };
  }

  /**
   * Validate media for Instagram requirements
   */
  async validateMedia(media: MediaObject[]): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];
    const capabilities = this.getPlatformCapabilities();

    if (media.length > capabilities.maxMediaPerPost) {
      errors.push(`Maximum ${capabilities.maxMediaPerPost} media items allowed`);
    }

    for (const item of media) {
      if (!capabilities.supportedMediaTypes.includes(item.type)) {
        errors.push(`Media type ${item.type} not supported`);
      }

      if (item.size && item.size > 100 * 1024 * 1024) { // 100MB
        errors.push('Media file too large (max 100MB)');
      }

      if (item.type === 'video' && item.duration && item.duration > 60) {
        errors.push('Video duration too long (max 60 seconds for feed posts)');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Get Instagram platform capabilities
   */
  getPlatformCapabilities() {
    return {
      maxMediaPerPost: 10,
      supportedMediaTypes: ['image', 'video', 'carousel'] as MediaType[],
      maxTextLength: 2200,
      supportsScheduling: true,
      supportsHashtags: true,
      supportsMentions: true,
      supportsLocation: true,
      supportsAnalytics: true,
    };
  }

  /**
   * Make authenticated request to Instagram Graph API
   */
  private async makeRequest(endpoint: string, params: Record<string, any> = {}, method: string = 'GET'): Promise<any> {
    if (!this.credentials?.accessToken) {
      throw new AuthenticationError(this.platform, 'No access token available');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('access_token', this.credentials.accessToken);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (method === 'POST' && Object.keys(params).length > 0) {
      options.body = JSON.stringify(params);
      url.search = `access_token=${this.credentials.accessToken}`;
    }

    const response = await fetch(url.toString(), options);
    const data = await response.json() as any;

    if (!response.ok) {
      if (response.status === 429) {
        throw new RateLimitError(this.platform, new Date(Date.now() + 60 * 60 * 1000));
      }
      
      if (response.status === 401) {
        throw new AuthenticationError(this.platform, data.error?.message || 'Authentication failed');
      }

      throw new Error(data.error?.message || `Instagram API error: ${response.status}`);
    }

    return data;
  }

  /**
   * Upload single media item
   */
  private async uploadSingleMedia(media: MediaObject, caption?: string): Promise<string> {
    const params: any = {
      media_type: media.type.toUpperCase(),
      media_url: media.url,
    };

    if (caption) {
      params.caption = caption;
    }

    const response = await this.makeRequest('/me/media', params, 'POST');
    return response.id;
  }

  /**
   * Upload carousel media
   */
  private async uploadCarouselMedia(media: MediaObject[], caption?: string): Promise<string> {
    // Upload individual media items first
    const mediaIds = await Promise.all(
      media.map(item => this.uploadSingleMedia(item))
    );

    // Create carousel container
    const params: any = {
      media_type: 'CAROUSEL',
      children: mediaIds.join(','),
    };

    if (caption) {
      params.caption = caption;
    }

    const response = await this.makeRequest('/me/media', params, 'POST');
    return response.id;
  }

  /**
   * Map Instagram media types to our standard types
   */
  private mapInstagramMediaType(instagramType: string): MediaType {
    switch (instagramType) {
      case 'IMAGE':
        return 'image';
      case 'VIDEO':
        return 'video';
      case 'CAROUSEL_ALBUM':
        return 'carousel';
      default:
        return 'image';
    }
  }

  /**
   * Map analytics period to Instagram format
   */
  private mapAnalyticsPeriod(period: string): string {
    switch (period) {
      case 'day':
        return 'day';
      case 'week':
        return 'week';
      case 'month':
        return 'days_28';
      default:
        return 'day';
    }
  }
}