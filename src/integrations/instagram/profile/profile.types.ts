/**
 * Instagram Profile Types
 * Based on Instagram Platform API responses
 */

export interface InstagramUserProfile {
  user_id: string;
  username: string;
  name: string;
  account_type: 'PERSONAL' | 'BUSINESS' | 'CREATOR';
  profile_picture_url: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  id: string;
  biography?: string;
  website?: string;
  is_verified_user?: boolean;
  is_user_follow_business?: boolean;
  is_business_follow_user?: boolean;
}

export interface ProfileFields {
  user_id?: boolean;
  username?: boolean;
  name?: boolean;
  account_type?: boolean;
  profile_picture_url?: boolean;
  followers_count?: boolean;
  follows_count?: boolean;
  media_count?: boolean;
  biography?: boolean;
  website?: boolean;
  is_verified_user?: boolean;
  is_user_follow_business?: boolean;
  is_business_follow_user?: boolean;
}

// Available profile fields for Instagram API
export const INSTAGRAM_PROFILE_FIELDS = [
  'user_id',
  'username', 
  'name',
  'account_type',
  'profile_picture_url',
  'followers_count',
  'follows_count',
  'media_count',
  'biography',
  'website',
  'is_verified_user',
  'is_user_follow_business',
  'is_business_follow_user'
] as const;

export type InstagramProfileField = typeof INSTAGRAM_PROFILE_FIELDS[number];

export interface ProfileRequest {
  access_token: string;
  fields?: string[];
}

export interface ProfileResponse {
  success: boolean;
  data?: InstagramUserProfile;
  error?: string;
}

export interface ProfileUpdateRequest {
  name?: string;
  bio?: string;
  website?: string;
  profile_picture?: string;
}

export interface ProfileUpdateResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ProfileInsights {
  reach: number;
  impressions: number;
  profile_views: number;
  website_clicks: number;
  email_contacts: number;
  phone_call_clicks: number;
  text_message_clicks: number;
  get_directions_clicks: number;
}

export interface ProfileInsightsRequest {
  access_token: string;
  metric: string[];
  period: 'day' | 'week' | 'days_28';
  since?: string;
  until?: string;
}

export interface ProfileInsightsResponse {
  success: boolean;
  data?: ProfileInsights;
  error?: string;
}