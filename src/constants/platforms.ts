/**
 * Platform Constants
 * Constants for social media platforms
 */

import { SocialPlatform } from '../types/common.types';

export const PLATFORMS: Record<SocialPlatform, {
  name: string;
  displayName: string;
  color: string;
  icon: string;
  baseUrl: string;
  apiVersion: string;
  maxTextLength: number;
  supportedMediaTypes: string[];
  maxMediaSize: number;
  rateLimits: {
    requests: number;
    window: number;
  };
}> = {
  instagram: {
    name: 'instagram',
    displayName: 'Instagram',
    color: '#E4405F',
    icon: 'instagram',
    baseUrl: 'https://graph.instagram.com',
    apiVersion: 'v18.0',
    maxTextLength: 2200,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
    maxMediaSize: 100 * 1024 * 1024, // 100MB
    rateLimits: {
      requests: 200,
      window: 3600, // 1 hour
    },
  },
  facebook: {
    name: 'facebook',
    displayName: 'Facebook',
    color: '#1877F2',
    icon: 'facebook',
    baseUrl: 'https://graph.facebook.com',
    apiVersion: 'v18.0',
    maxTextLength: 63206,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4', 'image/gif'],
    maxMediaSize: 1024 * 1024 * 1024, // 1GB
    rateLimits: {
      requests: 200,
      window: 3600,
    },
  },
  twitter: {
    name: 'twitter',
    displayName: 'Twitter',
    color: '#1DA1F2',
    icon: 'twitter',
    baseUrl: 'https://api.twitter.com',
    apiVersion: 'v2',
    maxTextLength: 280,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4', 'image/gif'],
    maxMediaSize: 512 * 1024 * 1024, // 512MB
    rateLimits: {
      requests: 300,
      window: 900, // 15 minutes
    },
  },
  linkedin: {
    name: 'linkedin',
    displayName: 'LinkedIn',
    color: '#0A66C2',
    icon: 'linkedin',
    baseUrl: 'https://api.linkedin.com',
    apiVersion: 'v2',
    maxTextLength: 3000,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
    maxMediaSize: 200 * 1024 * 1024, // 200MB
    rateLimits: {
      requests: 500,
      window: 86400, // 24 hours
    },
  },
  youtube: {
    name: 'youtube',
    displayName: 'YouTube',
    color: '#FF0000',
    icon: 'youtube',
    baseUrl: 'https://www.googleapis.com/youtube',
    apiVersion: 'v3',
    maxTextLength: 5000,
    supportedMediaTypes: ['video/mp4', 'video/avi', 'video/mov'],
    maxMediaSize: 2 * 1024 * 1024 * 1024, // 2GB
    rateLimits: {
      requests: 10000,
      window: 86400,
    },
  },
  tiktok: {
    name: 'tiktok',
    displayName: 'TikTok',
    color: '#000000',
    icon: 'tiktok',
    baseUrl: 'https://open-api.tiktok.com',
    apiVersion: 'v1.3',
    maxTextLength: 150,
    supportedMediaTypes: ['video/mp4'],
    maxMediaSize: 500 * 1024 * 1024, // 500MB
    rateLimits: {
      requests: 100,
      window: 3600,
    },
  },
};

export const PLATFORM_SCOPES = {
  instagram: [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_comments',
    'instagram_manage_insights',
    'pages_show_list',
    'pages_read_engagement',
    'business_management',
  ],
  facebook: [
    'pages_manage_posts',
    'pages_read_engagement',
    'pages_show_list',
    'pages_messaging',
    'business_management',
  ],
  twitter: [
    'tweet.read',
    'tweet.write',
    'users.read',
    'dm.read',
    'dm.write',
    'offline.access',
  ],
  linkedin: [
    'r_liteprofile',
    'r_emailaddress',
    'w_member_social',
    'r_organization_social',
    'w_organization_social',
  ],
  youtube: [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
  ],
  tiktok: [
    'user.info.basic',
    'video.list',
    'video.upload',
  ],
};

export const PLATFORM_ENDPOINTS = {
  instagram: {
    auth: 'https://api.instagram.com/oauth/authorize',
    token: 'https://api.instagram.com/oauth/access_token',
    me: '/me',
    media: '/me/media',
    conversations: '/me/conversations',
    messages: '/{conversation_id}/messages',
  },
  facebook: {
    auth: 'https://www.facebook.com/v18.0/dialog/oauth',
    token: 'https://graph.facebook.com/v18.0/oauth/access_token',
    me: '/me',
    pages: '/me/accounts',
    posts: '/{page_id}/feed',
    conversations: '/{page_id}/conversations',
  },
  twitter: {
    auth: 'https://twitter.com/i/oauth2/authorize',
    token: 'https://api.twitter.com/2/oauth2/token',
    me: '/2/users/me',
    tweets: '/2/tweets',
    messages: '/2/dm_conversations',
  },
  linkedin: {
    auth: 'https://www.linkedin.com/oauth/v2/authorization',
    token: 'https://www.linkedin.com/oauth/v2/accessToken',
    me: '/v2/people/~',
    posts: '/v2/ugcPosts',
    messages: '/v2/messaging/conversations',
  },
  youtube: {
    auth: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    me: '/youtube/v3/channels',
    videos: '/youtube/v3/videos',
    comments: '/youtube/v3/commentThreads',
  },
  tiktok: {
    auth: 'https://www.tiktok.com/auth/authorize/',
    token: 'https://open-api.tiktok.com/oauth/access_token/',
    me: '/v2/user/info/',
    videos: '/v2/video/list/',
    upload: '/v2/post/publish/video/init/',
  },
};

export const WEBHOOK_EVENTS = {
  instagram: [
    'messages',
    'messaging_postbacks',
    'messaging_optins',
    'message_deliveries',
    'message_reads',
    'messaging_handovers',
    'messaging_policy_enforcement',
    'comments',
    'mentions',
    'story_insights',
    'live_comments',
  ],
  facebook: [
    'messages',
    'messaging_postbacks',
    'messaging_optins',
    'message_deliveries',
    'message_reads',
    'messaging_handovers',
    'messaging_policy_enforcement',
    'feed',
    'mention',
    'page_changes',
    'leadgen',
  ],
  twitter: [
    'tweet_create_events',
    'direct_message_events',
    'direct_message_indicate_typing_events',
    'direct_message_mark_read_events',
    'follow_events',
    'unfollow_events',
    'favorite_events',
    'unfavorite_events',
    'user_event',
  ],
  linkedin: [
    'MEMBER_MESSAGING',
    'ORGANIZATION_MESSAGING',
    'SHARE_STATISTICS_UPDATE',
    'ORGANIZATION_SOCIAL_ACTION_NOTIFICATIONS',
  ],
  youtube: [
    'channelSection',
    'playlist',
    'playlistItem',
    'subscription',
    'video',
  ],
  tiktok: [
    'video.publish',
    'video.delete',
    'user.data.portability',
  ],
};

export const MEDIA_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  VIDEO: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'],
  AUDIO: ['audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

export const SUPPORTED_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi',
];

export const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
];

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
};