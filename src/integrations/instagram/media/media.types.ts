/**
 * Instagram Media Types
 * Based on Instagram Platform API responses
 */

export interface InstagramMediaOwner {
  id: string;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_url: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  timestamp: string;
  view_count?: number;
  username: string;
  thumbnail_url?: string;
  shortcode: string;
  permalink: string;
  owner: InstagramMediaOwner;
  media_product_type: 'FEED' | 'STORY' | 'REELS';
  like_count?: number;
  is_shared_to_feed?: boolean;
  is_comment_enabled?: boolean;
}

export interface MediaPagination {
  cursors: {
    before: string;
    after: string;
  };
  next?: string;
  previous?: string;
}

export interface MediaListResponse {
  data: InstagramMedia[];
  paging?: MediaPagination;
}

export interface MediaRequest {
  access_token: string;
  fields?: string[];
  limit?: number;
  after?: string;
  before?: string;
}

export interface MediaResponse {
  success: boolean;
  data?: MediaListResponse;
  error?: string;
}

export interface SingleMediaRequest {
  media_id: string;
  access_token: string;
  fields?: string[];
}

export interface SingleMediaResponse {
  success: boolean;
  data?: InstagramMedia;
  error?: string;
}

export interface MediaInsights {
  impressions: number;
  reach: number;
  engagement: number;
  saved: number;
  video_views?: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface MediaInsightsRequest {
  media_id: string;
  access_token: string;
  metric: string[];
}

export interface MediaInsightsResponse {
  success: boolean;
  data?: MediaInsights;
  error?: string;
}

export interface MediaComment {
  id: string;
  text: string;
  timestamp: string;
  username: string;
  like_count: number;
  replies?: MediaComment[];
}

export interface MediaCommentsRequest {
  media_id: string;
  access_token: string;
  limit?: number;
  after?: string;
}

export interface MediaCommentsResponse {
  success: boolean;
  data?: {
    data: MediaComment[];
    paging?: MediaPagination;
  };
  error?: string;
}

export interface CreateMediaRequest {
  image_url?: string;
  video_url?: string;
  caption?: string;
  access_token: string;
  media_type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  children?: string[]; // For carousel albums
}

export interface CreateMediaResponse {
  success: boolean;
  data?: {
    id: string;
  };
  error?: string;
}

export interface PublishMediaRequest {
  creation_id: string;
  access_token: string;
}

export interface PublishMediaResponse {
  success: boolean;
  data?: {
    id: string;
  };
  error?: string;
}