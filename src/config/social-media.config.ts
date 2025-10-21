/**
 * Social Media Platform Configuration
 * Centralized configuration for all social media platforms
 */

import env from './env.config';

export interface PlatformConfig {
  name: string;
  enabled: boolean;
  apiVersion?: string;
  baseUrl: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  credentials: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  webhookConfig?: {
    verifyToken: string;
    endpoint: string;
  };
  rateLimits: {
    requests: number;
    window: number; // in seconds
  };
}

export interface SocialMediaConfig {
  platforms: {
    instagram: PlatformConfig;
    facebook?: PlatformConfig;
    twitter?: PlatformConfig;
    linkedin?: PlatformConfig;
  };
}

const socialMediaConfig: SocialMediaConfig = {
  platforms: {
    instagram: {
      name: 'Instagram',
      enabled: true,
      apiVersion: 'v18.0',
      baseUrl: 'https://graph.instagram.com',
      authUrl: 'https://api.instagram.com/oauth/authorize',
      tokenUrl: 'https://api.instagram.com/oauth/access_token',
      scopes: [
        'instagram_basic',
        'instagram_content_publish',
        'instagram_manage_comments',
        'instagram_manage_insights',
        'pages_show_list',
        'pages_read_engagement',
        'business_management'
      ],
      credentials: {
        clientId: env.INSTAGRAM_APP_ID,
        clientSecret: env.INSTAGRAM_APP_SECRET,
        redirectUri: env.INSTAGRAM_REDIRECT_URI,
      },
      webhookConfig: {
        verifyToken: env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN,
        endpoint: '/webhook/instagram',
      },
      rateLimits: {
        requests: 200,
        window: 3600, // 1 hour
      },
    },
    facebook: env.FACEBOOK_APP_ID ? {
      name: 'Facebook',
      enabled: true,
      apiVersion: 'v18.0',
      baseUrl: 'https://graph.facebook.com',
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scopes: [
        'pages_manage_posts',
        'pages_read_engagement',
        'pages_show_list',
        'business_management'
      ],
      credentials: {
        clientId: env.FACEBOOK_APP_ID,
        clientSecret: env.FACEBOOK_APP_SECRET!,
        redirectUri: `${env.WEBHOOK_BASE_URL}/auth/facebook/callback`,
      },
      rateLimits: {
        requests: 200,
        window: 3600,
      },
    } : undefined,
    twitter: env.TWITTER_API_KEY ? {
      name: 'Twitter',
      enabled: true,
      apiVersion: 'v2',
      baseUrl: 'https://api.twitter.com',
      authUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      scopes: [
        'tweet.read',
        'tweet.write',
        'users.read',
        'offline.access'
      ],
      credentials: {
        clientId: env.TWITTER_API_KEY,
        clientSecret: env.TWITTER_API_SECRET!,
        redirectUri: `${env.WEBHOOK_BASE_URL}/auth/twitter/callback`,
      },
      rateLimits: {
        requests: 300,
        window: 900, // 15 minutes
      },
    } : undefined,
    linkedin: env.LINKEDIN_CLIENT_ID ? {
      name: 'LinkedIn',
      enabled: true,
      apiVersion: 'v2',
      baseUrl: 'https://api.linkedin.com',
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      scopes: [
        'r_liteprofile',
        'r_emailaddress',
        'w_member_social'
      ],
      credentials: {
        clientId: env.LINKEDIN_CLIENT_ID,
        clientSecret: env.LINKEDIN_CLIENT_SECRET!,
        redirectUri: `${env.WEBHOOK_BASE_URL}/auth/linkedin/callback`,
      },
      rateLimits: {
        requests: 500,
        window: 86400, // 24 hours
      },
    } : undefined,
  },
};

export default socialMediaConfig;