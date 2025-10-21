/**
 * Platform Types
 * Types and interfaces for social media platforms
 */

import { BaseEntity, SocialPlatform, MediaFile } from './common.types';

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