import axios from 'axios';
import logger from '../../../utils/logger';
import {
  CreateMediaContainerRequest,
  CreateMediaContainerResponse,
  PublishMediaRequest,
  PublishMediaResponse,
  SchedulePostRequest,
  SchedulePostResponse,
  UpdateScheduledPostRequest,
  UpdateScheduledPostResponse,
  CancelScheduledPostRequest,
  CancelScheduledPostResponse,
  GetScheduledPostsRequest,
  GetScheduledPostsResponse,
  CreateContentTemplateRequest,
  CreateContentTemplateResponse,
  GetContentTemplatesRequest,
  GetContentTemplatesResponse,
  BulkScheduleRequest,
  BulkScheduleResponse,
  GetPublishingStatsRequest,
  GetPublishingStatsResponse,
  MediaUploadRequest,
  MediaUploadResponse,
  CreatePostingScheduleRequest,
  CreatePostingScheduleResponse,
  ScheduledPost,
  ContentTemplate,
  PublishingStats,
  PostingSchedule,
  MediaContainer
} from './content-publishing.types';

/**
 * Instagram Content Publishing Service
 * Handles content creation, scheduling, and publishing to Instagram
 */
export class InstagramContentPublishingService {
  private readonly graphUrl = 'https://graph.instagram.com/v24.0';
  private readonly scheduledPosts = new Map<string, ScheduledPost>();
  private readonly contentTemplates = new Map<string, ContentTemplate>();
  private readonly postingSchedules = new Map<string, PostingSchedule>();

  /**
   * Create media container
   */
  async createMediaContainer(request: CreateMediaContainerRequest): Promise<CreateMediaContainerResponse> {
    try {
      const params: any = {
        access_token: request.access_token
      };

      // Add media URL based on type
      if (request.image_url) {
        params.image_url = request.image_url;
      } else if (request.video_url) {
        params.video_url = request.video_url;
        if (request.cover_url) {
          params.cover_url = request.cover_url;
        }
        if (request.thumb_offset) {
          params.thumb_offset = request.thumb_offset;
        }
      }

      // Add optional parameters
      if (request.caption) {
        params.caption = request.caption;
      }
      if (request.location_id) {
        params.location_id = request.location_id;
      }
      if (request.user_tags && request.user_tags.length > 0) {
        params.user_tags = JSON.stringify(request.user_tags);
      }
      if (request.product_tags && request.product_tags.length > 0) {
        params.product_tags = JSON.stringify(request.product_tags);
      }
      if (request.children && request.children.length > 0) {
        params.children = request.children.join(',');
        params.media_type = 'CAROUSEL_ALBUM';
      }
      if (request.collaborators && request.collaborators.length > 0) {
        params.collaborators = request.collaborators.join(',');
      }

      logger.info('Creating media container', {
        mediaType: request.media_type,
        hasCaption: !!request.caption,
        hasLocation: !!request.location_id,
        userTagsCount: request.user_tags?.length || 0,
        productTagsCount: request.product_tags?.length || 0
      });

      const response = await axios.post<any>(`${this.graphUrl}/me/media`, params);

      logger.info('Media container created successfully', {
        containerId: response.data.id
      });

      return {
        success: true,
        data: {
          id: response.data.id,
          status: 'IN_PROGRESS'
        }
      };
    } catch (error) {
      logger.error('Failed to create media container', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create media container'
      };
    }
  }

  /**
   * Publish media container
   */
  async publishMedia(request: PublishMediaRequest): Promise<PublishMediaResponse> {
    try {
      const params = {
        creation_id: request.creation_id,
        access_token: request.access_token
      };

      logger.info('Publishing media', {
        creationId: request.creation_id
      });

      const response = await axios.post<any>(`${this.graphUrl}/me/media_publish`, params);

      logger.info('Media published successfully', {
        mediaId: response.data.id
      });

      return {
        success: true,
        data: {
          id: response.data.id
        }
      };
    } catch (error) {
      logger.error('Failed to publish media', {
        creationId: request.creation_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish media'
      };
    }
  }

  /**
   * Schedule a post for later publishing
   */
  async schedulePost(request: SchedulePostRequest): Promise<SchedulePostResponse> {
    try {
      const scheduledPost: ScheduledPost = {
        id: Date.now().toString(),
        creation_id: '',
        media_type: request.media_type,
        caption: request.caption || '',
        media_urls: request.media_urls,
        scheduled_time: request.scheduled_time,
        status: 'SCHEDULED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'current_user', // Would get from auth context
        instagram_account_id: 'current_account' // Would get from auth context
      };

      // Create media container first
      const containerRequest: CreateMediaContainerRequest = {
        access_token: request.access_token,
        media_type: request.media_type,
        caption: request.caption,
        location_id: request.location_id,
        user_tags: request.user_tags,
        product_tags: request.product_tags,
        collaborators: request.collaborators
      };

      if (request.media_type === 'IMAGE') {
        containerRequest.image_url = request.media_urls[0];
      } else if (request.media_type === 'VIDEO') {
        containerRequest.video_url = request.media_urls[0];
      } else if (request.media_type === 'CAROUSEL_ALBUM') {
        // For carousel, we'd need to create containers for each media item
        // This is a simplified implementation
        containerRequest.image_url = request.media_urls[0];
      }

      const containerResponse = await this.createMediaContainer(containerRequest);

      if (!containerResponse.success || !containerResponse.data) {
        throw new Error('Failed to create media container for scheduled post');
      }

      scheduledPost.creation_id = containerResponse.data.id;
      this.scheduledPosts.set(scheduledPost.id, scheduledPost);

      // In a real implementation, you would:
      // 1. Store this in a database
      // 2. Set up a job queue to publish at the scheduled time
      // 3. Handle timezone conversions

      logger.info('Post scheduled successfully', {
        postId: scheduledPost.id,
        scheduledTime: request.scheduled_time,
        mediaType: request.media_type
      });

      return {
        success: true,
        data: scheduledPost
      };
    } catch (error) {
      logger.error('Failed to schedule post', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule post'
      };
    }
  }

  /**
   * Update scheduled post
   */
  async updateScheduledPost(request: UpdateScheduledPostRequest): Promise<UpdateScheduledPostResponse> {
    try {
      const post = this.scheduledPosts.get(request.post_id);

      if (!post) {
        throw new Error('Scheduled post not found');
      }

      if (post.status !== 'SCHEDULED') {
        throw new Error('Cannot update post that is not scheduled');
      }

      // Update post properties
      if (request.caption !== undefined) {
        post.caption = request.caption;
      }
      if (request.scheduled_time !== undefined) {
        post.scheduled_time = request.scheduled_time;
      }
      post.updated_at = new Date().toISOString();

      this.scheduledPosts.set(request.post_id, post);

      logger.info('Scheduled post updated successfully', {
        postId: request.post_id
      });

      return {
        success: true,
        data: post
      };
    } catch (error) {
      logger.error('Failed to update scheduled post', {
        postId: request.post_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update scheduled post'
      };
    }
  }

  /**
   * Cancel scheduled post
   */
  async cancelScheduledPost(request: CancelScheduledPostRequest): Promise<CancelScheduledPostResponse> {
    try {
      const post = this.scheduledPosts.get(request.post_id);

      if (!post) {
        throw new Error('Scheduled post not found');
      }

      if (post.status !== 'SCHEDULED') {
        throw new Error('Cannot cancel post that is not scheduled');
      }

      post.status = 'CANCELLED';
      post.updated_at = new Date().toISOString();
      this.scheduledPosts.set(request.post_id, post);

      logger.info('Scheduled post cancelled successfully', {
        postId: request.post_id
      });

      return {
        success: true,
        message: 'Post cancelled successfully'
      };
    } catch (error) {
      logger.error('Failed to cancel scheduled post', {
        postId: request.post_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel scheduled post'
      };
    }
  }

  /**
   * Get scheduled posts
   */
  async getScheduledPosts(request: GetScheduledPostsRequest): Promise<GetScheduledPostsResponse> {
    try {
      let posts = Array.from(this.scheduledPosts.values());

      // Filter by status if specified
      if (request.status) {
        posts = posts.filter(post => post.status === request.status);
      }

      // Filter by date range if specified
      if (request.start_date) {
        posts = posts.filter(post => post.scheduled_time >= request.start_date!);
      }
      if (request.end_date) {
        posts = posts.filter(post => post.scheduled_time <= request.end_date!);
      }

      // Apply pagination
      const limit = request.limit || 20;
      const offset = request.offset || 0;
      const total = posts.length;
      const paginatedPosts = posts.slice(offset, offset + limit);

      logger.info('Retrieved scheduled posts', {
        total,
        returned: paginatedPosts.length,
        status: request.status
      });

      return {
        success: true,
        data: {
          posts: paginatedPosts,
          total,
          limit,
          offset
        }
      };
    } catch (error) {
      logger.error('Failed to get scheduled posts', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get scheduled posts'
      };
    }
  }

  /**
   * Create content template
   */
  async createContentTemplate(request: CreateContentTemplateRequest): Promise<CreateContentTemplateResponse> {
    try {
      const template: ContentTemplate = {
        id: Date.now().toString(),
        name: request.name,
        description: request.description,
        media_type: request.media_type,
        caption_template: request.caption_template,
        hashtags: request.hashtags || [],
        location_id: request.location_id,
        user_tags: request.user_tags,
        product_tags: request.product_tags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'current_user', // Would get from auth context
        usage_count: 0
      };

      this.contentTemplates.set(template.id, template);

      logger.info('Content template created successfully', {
        templateId: template.id,
        name: request.name,
        mediaType: request.media_type
      });

      return {
        success: true,
        data: template
      };
    } catch (error) {
      logger.error('Failed to create content template', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create content template'
      };
    }
  }

  /**
   * Get content templates
   */
  async getContentTemplates(request: GetContentTemplatesRequest): Promise<GetContentTemplatesResponse> {
    try {
      let templates = Array.from(this.contentTemplates.values());

      // Filter by media type if specified
      if (request.media_type) {
        templates = templates.filter(template => template.media_type === request.media_type);
      }

      // Apply pagination
      const limit = request.limit || 20;
      const offset = request.offset || 0;
      const total = templates.length;
      const paginatedTemplates = templates.slice(offset, offset + limit);

      logger.info('Retrieved content templates', {
        total,
        returned: paginatedTemplates.length,
        mediaType: request.media_type
      });

      return {
        success: true,
        data: {
          templates: paginatedTemplates,
          total,
          limit,
          offset
        }
      };
    } catch (error) {
      logger.error('Failed to get content templates', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get content templates'
      };
    }
  }

  /**
   * Bulk schedule multiple posts
   */
  async bulkSchedule(request: BulkScheduleRequest): Promise<BulkScheduleResponse> {
    try {
      const scheduled: ScheduledPost[] = [];
      const failed: { index: number; error: string }[] = [];

      for (let i = 0; i < request.posts.length; i++) {
        const postRequest = request.posts[i];
        try {
          const result = await this.schedulePost(postRequest);
          if (result.success && result.data) {
            scheduled.push(result.data);
          } else {
            failed.push({
              index: i,
              error: result.error || 'Unknown error'
            });
          }
        } catch (error) {
          failed.push({
            index: i,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      logger.info('Bulk schedule completed', {
        totalRequested: request.posts.length,
        scheduled: scheduled.length,
        failed: failed.length
      });

      return {
        success: true,
        data: {
          scheduled,
          failed,
          total_scheduled: scheduled.length,
          total_failed: failed.length
        }
      };
    } catch (error) {
      logger.error('Failed to bulk schedule posts', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to bulk schedule posts'
      };
    }
  }

  /**
   * Get publishing statistics
   */
  async getPublishingStats(request: GetPublishingStatsRequest): Promise<GetPublishingStatsResponse> {
    try {
      const posts = Array.from(this.scheduledPosts.values());
      
      // Filter by date range if specified
      let filteredPosts = posts;
      if (request.start_date) {
        filteredPosts = filteredPosts.filter(post => post.created_at >= request.start_date!);
      }
      if (request.end_date) {
        filteredPosts = filteredPosts.filter(post => post.created_at <= request.end_date!);
      }

      const totalScheduled = filteredPosts.filter(post => post.status === 'SCHEDULED').length;
      const totalPublished = filteredPosts.filter(post => post.status === 'PUBLISHED').length;
      const totalFailed = filteredPosts.filter(post => post.status === 'FAILED').length;
      const successRate = filteredPosts.length > 0 ? (totalPublished / filteredPosts.length) * 100 : 0;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const postsThisWeek = filteredPosts.filter(post => 
        new Date(post.created_at) >= weekAgo
      ).length;

      const postsThisMonth = filteredPosts.filter(post => 
        new Date(post.created_at) >= monthAgo
      ).length;

      const stats: PublishingStats = {
        total_scheduled: totalScheduled,
        total_published: totalPublished,
        total_failed: totalFailed,
        success_rate: Math.round(successRate * 100) / 100,
        upcoming_posts: totalScheduled,
        posts_this_week: postsThisWeek,
        posts_this_month: postsThisMonth,
        average_engagement: 0, // Would need to fetch from insights
        best_posting_times: ['09:00', '15:00', '21:00'], // Would analyze historical data
        popular_hashtags: ['#instagram', '#content', '#social'] // Would analyze from posts
      };

      logger.info('Publishing stats generated', {
        totalPosts: filteredPosts.length,
        successRate: stats.success_rate
      });

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      logger.error('Failed to get publishing stats', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get publishing stats'
      };
    }
  }

  /**
   * Create posting schedule
   */
  async createPostingSchedule(request: CreatePostingScheduleRequest): Promise<CreatePostingScheduleResponse> {
    try {
      const schedule: PostingSchedule = {
        id: Date.now().toString(),
        name: request.name,
        description: request.description,
        timezone: request.timezone,
        schedule: request.schedule,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'current_user' // Would get from auth context
      };

      this.postingSchedules.set(schedule.id, schedule);

      logger.info('Posting schedule created successfully', {
        scheduleId: schedule.id,
        name: request.name,
        timezone: request.timezone
      });

      return {
        success: true,
        data: schedule
      };
    } catch (error) {
      logger.error('Failed to create posting schedule', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create posting schedule'
      };
    }
  }

  /**
   * Create and publish media in one step
   */
  async createAndPublishMedia(request: { access_token: string; media_url: string; caption?: string }) {
    try {
      // First create media container
      const createRequest: CreateMediaContainerRequest = {
        access_token: request.access_token,
        caption: request.caption
      };

      // Determine if it's image or video based on URL
      if (request.media_url.match(/\.(jpg|jpeg|png|gif)$/i)) {
        createRequest.image_url = request.media_url;
      } else if (request.media_url.match(/\.(mp4|mov|avi)$/i)) {
        createRequest.video_url = request.media_url;
      } else {
        // Default to image
        createRequest.image_url = request.media_url;
      }

      const createResponse = await this.createMediaContainer(createRequest);
      
      if (!createResponse.success || !createResponse.data) {
        return createResponse;
      }

      // Then publish the media
      const publishRequest: PublishMediaRequest = {
        creation_id: createResponse.data.id,
        access_token: request.access_token
      };

      return await this.publishMedia(publishRequest);
    } catch (error) {
      logger.error('Failed to create and publish media', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create and publish media'
      };
    }
  }
}

export const instagramContentPublishingService = new InstagramContentPublishingService();