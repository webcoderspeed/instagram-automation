import axios from 'axios';
import logger from '../../../utils/logger';
import {
  InstagramMedia,
  MediaRequest,
  MediaResponse,
  SingleMediaRequest,
  SingleMediaResponse,
  MediaInsightsRequest,
  MediaInsightsResponse,
  MediaInsights,
  MediaCommentsRequest,
  MediaCommentsResponse,
  CreateMediaRequest,
  CreateMediaResponse,
  PublishMediaRequest,
  PublishMediaResponse
} from './media.types';

/**
 * Instagram Media Service
 * Handles all media-related operations
 */
export class InstagramMediaService {
  private readonly graphUrl = 'https://graph.instagram.com/v24.0';

  /**
   * Get user's media posts
   */
  async getUserMedia(request: MediaRequest): Promise<MediaResponse> {
    try {
      const fields = request.fields?.join(',') || 
        'id,caption,media_url,media_type,timestamp,view_count,username,thumbnail_url,shortcode,permalink,owner,media_product_type,like_count,is_shared_to_feed,is_comment_enabled';

      let url = `${this.graphUrl}/me/media?fields=${fields}&access_token=${request.access_token}`;

      if (request.limit) {
        url += `&limit=${request.limit}`;
      }
      if (request.after) {
        url += `&after=${request.after}`;
      }
      if (request.before) {
        url += `&before=${request.before}`;
      }

      logger.info('Fetching Instagram user media', {
        fields,
        limit: request.limit,
        url: url.replace(request.access_token, '[REDACTED]')
      });

      const response = await axios.get<any>(url);

      logger.info('Instagram media fetched successfully', {
        mediaCount: response.data.data?.length || 0,
        hasPaging: !!response.data.paging
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Failed to fetch Instagram media', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch media'
      };
    }
  }

  /**
   * Get specific media by ID
   */
  async getMediaById(request: SingleMediaRequest): Promise<SingleMediaResponse> {
    try {
      const fields = request.fields?.join(',') || 
        'id,caption,media_url,media_type,timestamp,view_count,username,thumbnail_url,shortcode,permalink,owner,media_product_type,like_count,is_shared_to_feed,is_comment_enabled';

      const url = `${this.graphUrl}/${request.media_id}?fields=${fields}&access_token=${request.access_token}`;

      logger.info('Fetching Instagram media by ID', {
        mediaId: request.media_id,
        fields,
        url: url.replace(request.access_token, '[REDACTED]')
      });

      const response = await axios.get<InstagramMedia>(url);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Failed to fetch Instagram media by ID', {
        mediaId: request.media_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch media'
      };
    }
  }

  /**
   * Get media insights (for business accounts)
   */
  async getMediaInsights(request: MediaInsightsRequest): Promise<MediaInsightsResponse> {
    try {
      const metrics = request.metric.join(',');
      const url = `${this.graphUrl}/${request.media_id}/insights?metric=${metrics}&access_token=${request.access_token}`;

      logger.info('Fetching Instagram media insights', {
        mediaId: request.media_id,
        metrics,
        url: url.replace(request.access_token, '[REDACTED]')
      });

      const response = await axios.get<{ data: any[] }>(url);

      // Process insights data
      const insights: Partial<MediaInsights> = {};
      if (response.data.data) {
        response.data.data.forEach((insight: any) => {
          const metricName = insight.name as keyof MediaInsights;
          insights[metricName] = insight.values?.[0]?.value || 0;
        });
      }

      return {
        success: true,
        data: insights as MediaInsights
      };
    } catch (error) {
      logger.error('Failed to fetch Instagram media insights', {
        mediaId: request.media_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch insights'
      };
    }
  }

  /**
   * Get media comments
   */
  async getMediaComments(request: MediaCommentsRequest): Promise<MediaCommentsResponse> {
    try {
      let url = `${this.graphUrl}/${request.media_id}/comments?fields=id,text,timestamp,username,like_count&access_token=${request.access_token}`;

      if (request.limit) {
        url += `&limit=${request.limit}`;
      }
      if (request.after) {
        url += `&after=${request.after}`;
      }

      logger.info('Fetching Instagram media comments', {
        mediaId: request.media_id,
        limit: request.limit,
        url: url.replace(request.access_token, '[REDACTED]')
      });

      const response = await axios.get<any>(url);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Failed to fetch Instagram media comments', {
        mediaId: request.media_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch comments'
      };
    }
  }

  /**
   * Create media container (first step of publishing)
   */
  async createMedia(request: CreateMediaRequest): Promise<CreateMediaResponse> {
    try {
      const payload: any = {
        access_token: request.access_token
      };

      if (request.image_url) {
        payload.image_url = request.image_url;
      }
      if (request.video_url) {
        payload.video_url = request.video_url;
      }
      if (request.caption) {
        payload.caption = request.caption;
      }
      if (request.media_type) {
        payload.media_type = request.media_type;
      }
      if (request.children) {
        payload.children = request.children.join(',');
      }

      logger.info('Creating Instagram media container', {
        mediaType: request.media_type,
        hasCaption: !!request.caption,
        hasImage: !!request.image_url,
        hasVideo: !!request.video_url
      });

      const response = await axios.post<any>(`${this.graphUrl}/me/media`, payload);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Failed to create Instagram media', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create media'
      };
    }
  }

  /**
   * Publish media (second step of publishing)
   */
  async publishMedia(request: PublishMediaRequest): Promise<PublishMediaResponse> {
    try {
      const payload = {
        creation_id: request.creation_id,
        access_token: request.access_token
      };

      logger.info('Publishing Instagram media', {
        creationId: request.creation_id
      });

      const response = await axios.post<any>(`${this.graphUrl}/me/media_publish`, payload);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Failed to publish Instagram media', {
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
   * Get recent media for dashboard
   */
  async getRecentMedia(accessToken: string, limit: number = 10): Promise<MediaResponse> {
    return this.getUserMedia({
      access_token: accessToken,
      limit,
      fields: ['id', 'media_url', 'media_type', 'timestamp', 'like_count', 'permalink']
    });
  }

  /**
   * Get media performance summary
   */
  async getMediaPerformance(mediaId: string, accessToken: string): Promise<MediaInsightsResponse> {
    return this.getMediaInsights({
      media_id: mediaId,
      access_token: accessToken,
      metric: ['impressions', 'reach', 'engagement', 'likes', 'comments', 'shares']
    });
  }
}

export const instagramMediaService = new InstagramMediaService();