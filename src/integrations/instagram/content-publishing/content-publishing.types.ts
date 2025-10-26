/**
 * Instagram Content Publishing Types
 * Based on Instagram Platform API for content creation and publishing
 */

export interface MediaContainer {
  id: string;
  status: 'IN_PROGRESS' | 'FINISHED' | 'ERROR';
  status_code?: string;
}

export interface CreateMediaContainerRequest {
  image_url?: string;
  video_url?: string;
  caption?: string;
  location_id?: string;
  user_tags?: UserTag[];
  product_tags?: ProductTag[];
  access_token: string;
  media_type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  children?: string[]; // For carousel posts
  cover_url?: string; // For video thumbnails
  thumb_offset?: number; // For video thumbnails
  audio_name?: string; // For reels
  collaborators?: string[]; // User IDs for collaboration posts
}

export interface UserTag {
  username: string;
  x: number; // Position percentage (0-1)
  y: number; // Position percentage (0-1)
}

export interface ProductTag {
  product_id: string;
  x: number;
  y: number;
}

export interface CreateMediaContainerResponse {
  success: boolean;
  data?: MediaContainer;
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

export interface ScheduledPost {
  id: string;
  creation_id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  caption: string;
  media_urls: string[];
  scheduled_time: string;
  status: 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
  user_id: string;
  instagram_account_id: string;
  published_media_id?: string;
  error_message?: string;
}

export interface SchedulePostRequest {
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_urls: string[];
  caption?: string;
  scheduled_time: string;
  location_id?: string;
  user_tags?: UserTag[];
  product_tags?: ProductTag[];
  collaborators?: string[];
  access_token: string;
}

export interface SchedulePostResponse {
  success: boolean;
  data?: ScheduledPost;
  error?: string;
}

export interface UpdateScheduledPostRequest {
  post_id: string;
  caption?: string;
  scheduled_time?: string;
  location_id?: string;
  user_tags?: UserTag[];
  product_tags?: ProductTag[];
}

export interface UpdateScheduledPostResponse {
  success: boolean;
  data?: ScheduledPost;
  error?: string;
}

export interface CancelScheduledPostRequest {
  post_id: string;
}

export interface CancelScheduledPostResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface GetScheduledPostsRequest {
  access_token: string;
  status?: 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'CANCELLED';
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
}

export interface GetScheduledPostsResponse {
  success: boolean;
  data?: {
    posts: ScheduledPost[];
    total: number;
    limit: number;
    offset: number;
  };
  error?: string;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  caption_template: string;
  hashtags: string[];
  location_id?: string;
  user_tags?: UserTag[];
  product_tags?: ProductTag[];
  created_at: string;
  updated_at: string;
  user_id: string;
  usage_count: number;
}

export interface CreateContentTemplateRequest {
  name: string;
  description?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  caption_template: string;
  hashtags?: string[];
  location_id?: string;
  user_tags?: UserTag[];
  product_tags?: ProductTag[];
}

export interface CreateContentTemplateResponse {
  success: boolean;
  data?: ContentTemplate;
  error?: string;
}

export interface GetContentTemplatesRequest {
  media_type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  limit?: number;
  offset?: number;
}

export interface GetContentTemplatesResponse {
  success: boolean;
  data?: {
    templates: ContentTemplate[];
    total: number;
    limit: number;
    offset: number;
  };
  error?: string;
}

export interface BulkScheduleRequest {
  posts: SchedulePostRequest[];
  access_token: string;
}

export interface BulkScheduleResponse {
  success: boolean;
  data?: {
    scheduled: ScheduledPost[];
    failed: {
      index: number;
      error: string;
    }[];
    total_scheduled: number;
    total_failed: number;
  };
  error?: string;
}

export interface PublishingStats {
  total_scheduled: number;
  total_published: number;
  total_failed: number;
  success_rate: number;
  upcoming_posts: number;
  posts_this_week: number;
  posts_this_month: number;
  average_engagement: number;
  best_posting_times: string[];
  popular_hashtags: string[];
}

export interface GetPublishingStatsRequest {
  access_token: string;
  start_date?: string;
  end_date?: string;
}

export interface GetPublishingStatsResponse {
  success: boolean;
  data?: PublishingStats;
  error?: string;
}

export interface MediaUploadRequest {
  file: Buffer | string; // File buffer or base64 string
  filename: string;
  media_type: 'IMAGE' | 'VIDEO';
  access_token: string;
}

export interface MediaUploadResponse {
  success: boolean;
  data?: {
    media_url: string;
    media_id: string;
    upload_id: string;
  };
  error?: string;
}

export interface PostingSchedule {
  id: string;
  name: string;
  description?: string;
  timezone: string;
  schedule: {
    [day: string]: string[]; // "monday": ["09:00", "15:00", "21:00"]
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CreatePostingScheduleRequest {
  name: string;
  description?: string;
  timezone: string;
  schedule: {
    [day: string]: string[];
  };
}

export interface CreatePostingScheduleResponse {
  success: boolean;
  data?: PostingSchedule;
  error?: string;
}